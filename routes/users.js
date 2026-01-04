const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?').get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's image history count
        const imageCount = db.prepare('SELECT COUNT(*) as count FROM user_images WHERE user_id = ?').get(req.user.userId);

        res.json({
            user: {
                ...user,
                imageCount: imageCount.count
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.userId;

        const updates = [];
        const params = [];

        if (username) {
            // Validate username
            const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
            if (!usernameRegex.test(username)) {
                return res.status(400).json({ error: 'Username must be 3-30 characters, alphanumeric and underscores only' });
            }

            // Check if username is taken
            const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.toLowerCase(), userId);
            if (existing) {
                return res.status(409).json({ error: 'Username already taken' });
            }

            updates.push('username = ?');
            params.push(username.toLowerCase());
        }

        if (email) {
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            // Check if email is taken
            const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), userId);
            if (existing) {
                return res.status(409).json({ error: 'Email already taken' });
            }

            updates.push('email = ?');
            params.push(email.toLowerCase());
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        const updatedUser = db.prepare('SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?').get(userId);

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get current user
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, userId);

        // Invalidate all sessions except current
        const authHeader = req.headers.authorization;
        const currentToken = authHeader.substring(7);
        db.prepare('DELETE FROM user_sessions WHERE user_id = ? AND token != ?').run(userId, currentToken);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId;

        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }

        // Get current user
        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Delete user (cascades to sessions and images)
        db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM user_images WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's image history
router.get('/images', authenticateToken, (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const images = db.prepare(`
            SELECT id, original_filename, stored_filename, operation, created_at 
            FROM user_images 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(req.user.userId, limit, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM user_images WHERE user_id = ?').get(req.user.userId);

        res.json({
            images,
            pagination: {
                page,
                limit,
                total: total.count,
                totalPages: Math.ceil(total.count / limit)
            }
        });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
