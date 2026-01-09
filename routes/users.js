const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure profile pictures directory exists
const profilePicsDir = path.join(__dirname, '..', 'profile_pictures');
if (!fs.existsSync(profilePicsDir)) {
    fs.mkdirSync(profilePicsDir, { recursive: true });
}

// Configure multer for profile picture uploads
const profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilePicsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user.userId}_${Date.now()}${ext}`);
    }
});

const profilePicUpload = multer({
    storage: profilePicStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
    try {
        const user = db.prepare('SELECT id, email, username, profile_picture, created_at, updated_at FROM users WHERE id = ?').get(req.user.userId);
        
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

        const updatedUser = db.prepare('SELECT id, email, username, profile_picture, created_at, updated_at FROM users WHERE id = ?').get(userId);

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Upload profile picture
router.post('/profile/picture', authenticateToken, profilePicUpload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.userId;
        const picturePath = `/profile_pictures/${req.file.filename}`;

        // Get old profile picture to delete
        const oldUser = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(userId);
        
        // Update user with new profile picture
        db.prepare('UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(picturePath, userId);

        // Delete old profile picture if exists
        if (oldUser && oldUser.profile_picture) {
            const oldPicPath = path.join(__dirname, '..', oldUser.profile_picture);
            if (fs.existsSync(oldPicPath)) {
                fs.unlinkSync(oldPicPath);
            }
        }

        const updatedUser = db.prepare('SELECT id, email, username, profile_picture, created_at, updated_at FROM users WHERE id = ?').get(userId);

        res.json({
            message: 'Profile picture updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete profile picture
router.delete('/profile/picture', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get current profile picture
        const user = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(userId);
        
        if (user && user.profile_picture) {
            const picPath = path.join(__dirname, '..', user.profile_picture);
            if (fs.existsSync(picPath)) {
                fs.unlinkSync(picPath);
            }
        }

        // Update user to remove profile picture
        db.prepare('UPDATE users SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

        const updatedUser = db.prepare('SELECT id, email, username, profile_picture, created_at, updated_at FROM users WHERE id = ?').get(userId);

        res.json({
            message: 'Profile picture removed successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
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
            SELECT id, original_filename, stored_filename, operation, cloud_url, cloud_public_id, file_size, dimensions, created_at 
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

// Delete a specific image from history
router.delete('/images/:imageId', authenticateToken, async (req, res) => {
    try {
        const { imageId } = req.params;
        const userId = req.user.userId;

        // Get the image to check ownership and get cloud public ID
        const image = db.prepare('SELECT * FROM user_images WHERE id = ? AND user_id = ?').get(imageId, userId);
        
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete from Cloudinary if it has a cloud_public_id
        if (image.cloud_public_id) {
            const { deleteFromCloudinary } = require('../config/cloudinary');
            await deleteFromCloudinary(image.cloud_public_id);
        }

        // Delete from database
        db.prepare('DELETE FROM user_images WHERE id = ?').run(imageId);

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get usage stats and remaining limits
router.get('/usage', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get user subscription tier
        const user = db.prepare('SELECT subscription_tier, subscription_expires FROM users WHERE id = ?').get(userId);
        const tier = user?.subscription_tier || 'free';
        
        // Check if subscription is expired
        let activeTier = tier;
        if (user?.subscription_expires && new Date(user.subscription_expires) < new Date()) {
            activeTier = 'free';
        }
        
        // Get plan limits
        const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(activeTier);
        
        // Get today's usage
        const usage2x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE user_id = ? AND model = '2x' AND date(created_at) = date('now')
        `).get(userId);
        
        const usage4x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE user_id = ? AND model = '4x' AND date(created_at) = date('now')
        `).get(userId);
        
        // Get this month's total usage
        const monthlyUsage = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE user_id = ? AND date(created_at) >= date('now', 'start of month')
        `).get(userId);
        
        res.json({
            tier: activeTier,
            plan: plan ? {
                name: plan.name,
                priceMonthly: plan.price_monthly,
                priceYearly: plan.price_yearly,
                maxResolution: plan.max_resolution,
                batchEnabled: plan.batch_enabled === 1,
                priorityQueue: plan.priority_queue === 1
            } : null,
            usage: {
                today: {
                    upscale2x: { used: usage2x?.count || 0, limit: plan?.upscale_2x_limit ?? 5 },
                    upscale4x: { used: usage4x?.count || 0, limit: plan?.upscale_4x_limit ?? 2 }
                },
                thisMonth: monthlyUsage?.count || 0
            },
            limits: {
                upscale2x: plan?.upscale_2x_limit ?? 5,
                upscale4x: plan?.upscale_4x_limit ?? 2,
                maxFileSizeMB: activeTier === 'business' ? 100 : activeTier === 'pro' ? 25 : 10
            },
            subscriptionExpires: user?.subscription_expires,
            resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        });
    } catch (error) {
        console.error('Get usage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get usage for guest (by fingerprint)
router.post('/guest-usage', (req, res) => {
    try {
        const { fingerprint } = req.body;
        
        if (!fingerprint) {
            return res.status(400).json({ error: 'Fingerprint required' });
        }
        
        // Get guest plan limits
        const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get('guest');
        
        // Get today's usage
        const usage2x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE fingerprint = ? AND model = '2x' AND date(created_at) = date('now')
        `).get(fingerprint);
        
        const usage4x = db.prepare(`
            SELECT COUNT(*) as count FROM usage_tracking 
            WHERE fingerprint = ? AND model = '4x' AND date(created_at) = date('now')
        `).get(fingerprint);
        
        res.json({
            tier: 'guest',
            usage: {
                today: {
                    upscale2x: { used: usage2x?.count || 0, limit: plan?.upscale_2x_limit ?? 3 },
                    upscale4x: { used: usage4x?.count || 0, limit: plan?.upscale_4x_limit ?? 1 }
                }
            },
            limits: {
                upscale2x: plan?.upscale_2x_limit ?? 3,
                upscale4x: plan?.upscale_4x_limit ?? 1,
                maxFileSizeMB: 5
            },
            resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        });
    } catch (error) {
        console.error('Get guest usage error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
