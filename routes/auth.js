const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { generateVerificationCode, sendVerificationEmail } = require('../services/email');

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

// Register new user (with email verification)
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
        const existingUser = db.prepare('SELECT id, email_verified FROM users WHERE email = ? OR username = ?').get(email.toLowerCase(), username.toLowerCase());
        if (existingUser) {
            // If user exists but not verified, allow re-registration
            if (!existingUser.email_verified) {
                // Delete unverified user to allow fresh registration
                db.prepare('DELETE FROM users WHERE id = ?').run(existingUser.id);
            } else {
                return res.status(409).json({ error: 'User with this email or username already exists' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Create user (unverified)
        const userId = uuidv4();
        db.prepare(`
            INSERT INTO users (id, email, username, password, email_verified, verification_code, verification_expires, subscription_tier) 
            VALUES (?, ?, ?, ?, 0, ?, ?, 'free')
        `).run(
            userId,
            email.toLowerCase(),
            username.toLowerCase(),
            hashedPassword,
            verificationCode,
            verificationExpires.toISOString()
        );

        // Send verification email
        const emailResult = await sendVerificationEmail(email.toLowerCase(), verificationCode, username);
        
        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Still allow registration, user can request new code
        }

        res.status(201).json({
            message: 'Registration successful. Please check your email for verification code.',
            requiresVerification: true,
            email: email.toLowerCase()
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and verification code are required' });
        }

        // Find user
        const user = db.prepare(`
            SELECT * FROM users 
            WHERE email = ? AND verification_code = ? AND verification_expires > datetime('now')
        `).get(email.toLowerCase(), code);

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification code' });
        }

        // Mark as verified
        db.prepare(`
            UPDATE users 
            SET email_verified = 1, verification_code = NULL, verification_expires = NULL, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(user.id);

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

        res.json({
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                email_verified: true,
                subscription_tier: user.subscription_tier || 'free'
            },
            token
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Resend verification code
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find unverified user
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND email_verified = 0').get(email.toLowerCase());

        if (!user) {
            return res.status(404).json({ error: 'No unverified account found with this email' });
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

        db.prepare(`
            UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?
        `).run(verificationCode, verificationExpires.toISOString(), user.id);

        // Send email
        const emailResult = await sendVerificationEmail(email.toLowerCase(), verificationCode, user.username);

        if (!emailResult.success) {
            return res.status(500).json({ error: 'Failed to send verification email' });
        }

        res.json({ message: 'Verification code sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email/username and password are required' });
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

        // Check if email is verified
        if (!user.email_verified) {
            return res.status(403).json({ 
                error: 'Please verify your email before logging in',
                requiresVerification: true,
                email: user.email
            });
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
                profile_picture: user.profile_picture,
                email_verified: !!user.email_verified,
                subscription_tier: user.subscription_tier || 'free'
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
        const user = db.prepare('SELECT id, email, username, profile_picture, email_verified, subscription_tier, subscription_expires, created_at FROM users WHERE id = ?').get(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get usage stats for current month
        const usage = getUsageStats(user.id);

        res.json({ 
            user: {
                ...user,
                email_verified: !!user.email_verified
            },
            usage 
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Auth verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get usage stats for a user (helper function)
function getUsageStats(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const usage2x = db.prepare(`
        SELECT COUNT(*) as count FROM usage_tracking 
        WHERE user_id = ? AND model = '2x' AND created_at >= ?
    `).get(userId, startOfMonth.toISOString());
    
    const usage4x = db.prepare(`
        SELECT COUNT(*) as count FROM usage_tracking 
        WHERE user_id = ? AND model = '4x' AND created_at >= ?
    `).get(userId, startOfMonth.toISOString());
    
    return {
        upscale_2x: usage2x?.count || 0,
        upscale_4x: usage4x?.count || 0,
        period_start: startOfMonth.toISOString()
    };
}

// Get usage for guest/unregistered users (by fingerprint)
router.get('/usage/guest', (req, res) => {
    try {
        const fingerprint = req.query.fingerprint;
        if (!fingerprint) {
            return res.status(400).json({ error: 'Fingerprint required' });
        }
        
        // Get total uses (no monthly reset for guests)
        const usage2x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE fingerprint = ? AND model = '2x' AND user_id IS NULL
        `).get(fingerprint);
        
        const usage4x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE fingerprint = ? AND model = '4x' AND user_id IS NULL
        `).get(fingerprint);
        
        // Guest limits from subscription_plans
        const guestPlan = db.prepare("SELECT upscale_2x_limit, upscale_4x_limit FROM subscription_plans WHERE name = 'guest'").get();
        const limits = guestPlan ? 
            { upscale_2x: guestPlan.upscale_2x_limit, upscale_4x: guestPlan.upscale_4x_limit } : 
            { upscale_2x: 5, upscale_4x: 3 };
        
        res.json({
            usage: {
                upscale_2x: usage2x?.count || 0,
                upscale_4x: usage4x?.count || 0
            },
            limits,
            remaining: {
                upscale_2x: Math.max(0, limits.upscale_2x - (usage2x?.count || 0)),
                upscale_4x: Math.max(0, limits.upscale_4x - (usage4x?.count || 0))
            }
        });
    } catch (error) {
        console.error('Guest usage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get subscription plans
router.get('/plans', (req, res) => {
    try {
        const plans = db.prepare('SELECT * FROM subscription_plans ORDER BY price_monthly ASC').all();
        res.json({ 
            plans: plans.map(p => ({
                ...p,
                limits: JSON.parse(p.limits || '{}'),
                features: JSON.parse(p.features || '[]')
            }))
        });
    } catch (error) {
        console.error('Plans error:', error);
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
