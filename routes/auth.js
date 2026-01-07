const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate input
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3-30 characters, alphanumeric and underscores only' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.toLowerCase(), username.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userId = uuidv4();
        db.prepare('INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)').run(
            userId,
            email.toLowerCase(),
            username.toLowerCase(),
            hashedPassword
        );

        // Generate JWT token
        const token = jwt.sign({ userId, email: email.toLowerCase(), username: username.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Store session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        db.prepare('INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(
            sessionId,
            userId,
            token,
            expiresAt.toISOString()
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: userId,
                email: email.toLowerCase(),
                username: username.toLowerCase()
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email or username
        const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(
            email.toLowerCase(),
            email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Store session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        db.prepare('INSERT INTO user_sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(
            sessionId,
            user.id,
            token,
            expiresAt.toISOString()
        );

        // Update last login
        db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                profile_picture: user.profile_picture
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout user
router.post('/logout', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Remove session from database
            db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token and get current user
router.get('/me', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists and is valid
        const session = db.prepare("SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime('now')").get(token);
        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid' });
        }

        // Get user
        const user = db.prepare('SELECT id, email, username, profile_picture, created_at FROM users WHERE id = ?').get(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Auth verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token
router.post('/refresh', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const oldToken = authHeader.substring(7);

        // Verify existing token (even if expired, we can refresh)
        let decoded;
        try {
            decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if session exists
        const session = db.prepare('SELECT * FROM user_sessions WHERE token = ?').get(oldToken);
        if (!session) {
            return res.status(401).json({ error: 'Session not found' });
        }

        // Get user
        const user = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new token
        const newToken = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Update session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        db.prepare('UPDATE user_sessions SET token = ?, expires_at = ? WHERE id = ?').run(
            newToken,
            expiresAt.toISOString(),
            session.id
        );

        res.json({
            message: 'Token refreshed',
            token: newToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
