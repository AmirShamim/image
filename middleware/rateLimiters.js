const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';

// Helper: check if request is from an admin user
function isAdminRequest(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            // Support role='admin' or hardcoded admin userId
            return decoded.role === 'admin' || decoded.userId === 'admin-hardcoded';
        } catch (e) {
            return false;
        }
    }
    return false;
}

function shouldSkip(req) {
    // 1. Skip if not in production
    if (!isProduction) return true;

    // 2. Skip for local development IPs
    const ip = req.ip || req.connection.remoteAddress;
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;

    // 3. Skip for authenticated Admins
    if (isAdminRequest(req)) return true;

    return false;
}

// Global rate limit for all API requests
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: { error: 'Too many requests. Please try again later.', retryAfter: 15 * 60 },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Strict rate limit for image processing endpoints
const processLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 image processes per minute per IP
    message: { error: 'Processing limit reached. Please wait a moment.', retryAfter: 60 },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

// Auth rate limit (prevent brute force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 login attempts per 15 minutes
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
});

module.exports = {
    globalLimiter,
    processLimiter,
    authLimiter,
    isAdminRequest
};
