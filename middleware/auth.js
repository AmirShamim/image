const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists and is valid
        const session = db.prepare('SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
        
        if (!session) {
            return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
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
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists and is valid
        const session = db.prepare('SELECT * FROM user_sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
        
        if (session) {
            req.user = decoded;
            req.token = token;
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
