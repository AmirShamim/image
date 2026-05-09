const jwt = require('jsonwebtoken');
const db = require('../database-pg');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists (async — works on both SQLite and Postgres)
        const session = await db.prepare('SELECT * FROM user_sessions WHERE token = ?').getAsync(token);

        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
        }

        // Check expiry in JS (cross-DB compatible)
        if (session.expires_at) {
            const expiresAt = new Date(session.expires_at);
            if (Number.isFinite(expiresAt.getTime()) && expiresAt <= new Date()) {
                return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
            }
        }

        // Attach user info to request
        req.user = decoded;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Optional authentication - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists (async — works on both SQLite and Postgres)
        const session = await db.prepare('SELECT * FROM user_sessions WHERE token = ?').getAsync(token);

        if (session) {
            // Check expiry in JS
            const expiresAt = new Date(session.expires_at);
            if (Number.isFinite(expiresAt.getTime()) && expiresAt > new Date()) {
                req.user = decoded;
                req.token = token;
            } else {
                req.user = null;
            }
        } else {
            req.user = null;
        }
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth,
    JWT_SECRET
};
