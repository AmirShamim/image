const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = require('../database-pg');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const gpuProvider = require('../gpu-provider');
const { optionalAuth } = require('../middleware/auth');
const { processLimiter, isAdminRequest } = require('../middleware/rateLimiters');
const { queueMiddleware } = require('../middleware/queue');
const upload = require('../config/upload');

const isProduction = process.env.NODE_ENV === 'production';



// Upscale endpoint (GPU-accelerated Real-ESRGAN — Pro and Anime models only)
router.post('/upscale', processLimiter, queueMiddleware, optionalAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const inputPath = req.file.path;
    const originalFilename = req.file.originalname;

    // Parse scale (2x or 4x only — GPU models support these)
    const scaleInput = req.body.scale || req.body.model || '4x';
    const scale = parseInt(scaleInput.replace('x', ''), 10);
    const validScales = [2, 4];
    const finalScale = validScales.includes(scale) ? scale : 4;

    // Parse model type (only realesrgan and realesrgan-anime)
    const modelType = req.body.modelType || 'realesrgan-anime';
    const validModels = ['realesrgan', 'realesrgan-anime'];
    const finalModelType = validModels.includes(modelType) ? modelType : 'realesrgan-anime';

    const outputPath = `processed/${req.file.filename}_upscaled_${finalModelType}_${finalScale}x.png`;

    // Get user info and limits
    let userId = req.user ? req.user.userId : null;
    let fingerprint = req.body.fingerprint || null;
    let subscriptionTier = 'guest';

    // Get subscription tier for authenticated users
    if (userId) {
        try {
            const user = db.prepare('SELECT subscription_tier FROM users WHERE id = ?').get(userId);
            if (user && user.subscription_tier) {
                subscriptionTier = user.subscription_tier;
            }
        } catch (err) {
            console.error('Failed to get user subscription:', err);
        }
    }

    // Get plan limits
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(subscriptionTier);
    const dailyLimit = finalScale === 2
        ? (plan?.upscale_2x_limit ?? 3)
        : (plan?.upscale_4x_limit ?? 1);

    // Check if Real-ESRGAN Pro is allowed for this tier (skip check in dev mode or for admins)
    const isProTier = ['pro', 'business'].includes(subscriptionTier);
    if (finalModelType === 'realesrgan' && !isProTier && isProduction && !isAdminRequest(req)) {
        fs.unlinkSync(inputPath);
        return res.status(403).json({
            error: 'Model not available',
            message: 'Real-ESRGAN Pro model is only available for Pro and Business subscribers.',
            upgradeUrl: '/pricing'
        });
    }

    // -1 means unlimited; skip limits entirely in dev mode or for admins
    if (dailyLimit !== -1 && isProduction && !isAdminRequest(req)) {
        // Count today's usage
        let usageCount = 0;
        try {
            if (userId) {
                const result = db.prepare(`
                    SELECT COUNT(*) as count
                    FROM usage_tracking
                    WHERE user_id = ? AND model = ? AND date(created_at) = date('now')
                `).get(userId, `${finalScale}x`);
                usageCount = result?.count || 0;
            } else if (fingerprint) {
                const result = db.prepare(`
                    SELECT COUNT(*) as count
                    FROM usage_tracking
                    WHERE fingerprint = ? AND model = ? AND date(created_at) = date('now')
                `).get(fingerprint, `${finalScale}x`);
                usageCount = result?.count || 0;
            }
        } catch (err) {
            console.error('Failed to check usage:', err);
        }

        // Enforce limit
        if (usageCount >= dailyLimit) {
            fs.unlinkSync(inputPath);
            return res.status(429).json({
                error: 'Daily limit reached',
                message: `You've used all ${dailyLimit} ${finalScale}x upscales for today. Upgrade to Pro for more.`,
                limit: dailyLimit,
                used: usageCount,
                upgradeUrl: '/pricing',
                resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
            });
        }
    }

    // Check file size limits based on tier
    const maxFileSizeMB = subscriptionTier === 'business' ? 50 :
        subscriptionTier === 'pro' ? 25 :
            subscriptionTier === 'free' ? 5 : 5;

    if (req.file.size > maxFileSizeMB * 1024 * 1024) {
        fs.unlinkSync(inputPath);
        return res.status(413).json({
            error: 'File too large',
            message: `Max file size for ${subscriptionTier} tier is ${maxFileSizeMB}MB. Upgrade for larger files.`,
            maxSize: maxFileSizeMB * 1024 * 1024,
            fileSize: req.file.size
        });
    }

    // Check image dimensions for upscaling limits (skip in dev mode)
    // 4x: max 1024px, 2x: max 2048px (GPU VRAM constraint from benchmarks)
    if (isProduction) {
        const sharp = require('sharp');
        try {
            const metadata = await sharp(inputPath).metadata();
            const maxDimension = finalScale === 2 ? 2048 : 1024; // Match frontend logic: 2048 for 2x, 1024 for 4x

            if (metadata.width > maxDimension || metadata.height > maxDimension) {
                fs.unlinkSync(inputPath);
                return res.status(400).json({
                    error: 'Image too large for this scale',
                    message: `${finalScale}x upscaling requires images ≤${maxDimension}px due to GPU limits. Your image is ${metadata.width}×${metadata.height}px.`,
                    limit: maxDimension,
                    imageWidth: metadata.width,
                    imageHeight: metadata.height,
                    upgradeUrl: '/pricing'
                });
            }
        } catch (err) {
            console.error('Failed to check image dimensions:', err);
        }
    }

    // ============== GPU PROVIDER UPSCALE ==============
    try {
        const result = await gpuProvider.upscale(inputPath, outputPath, {
            model: finalModelType,
            scale: finalScale,
        });

        console.log(`Upscale complete: ${result.width}x${result.height} via ${result.provider}`);

        let cloudUrl = null;
        let cloudPublicId = null;

        // Upload to Cloudinary if user is authenticated and Cloudinary is configured
        if (req.user && isCloudinaryConfigured()) {
            try {
                const cloudResult = await uploadToCloudinary(outputPath, {
                    public_id: `upscale_${req.user.userId}_${Date.now()}`
                });
                if (cloudResult.success) {
                    cloudUrl = cloudResult.url;
                    cloudPublicId = cloudResult.publicId;
                    console.log('Uploaded to Cloudinary:', cloudUrl);
                }
            } catch (err) {
                console.error('Cloudinary upload failed:', err);
            }
        }

        // Log image operation if user is authenticated
        if (req.user) {
            try {
                const imageId = uuidv4();
                db.prepare(`
                    INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation, cloud_url,
                                             cloud_public_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    imageId,
                    req.user.userId,
                    originalFilename,
                    `${req.file.filename}_upscaled_${finalModelType}_${finalScale}x.png`,
                    'upscale',
                    cloudUrl,
                    cloudPublicId
                );
            } catch (err) {
                console.error('Failed to log image operation:', err);
            }
        }

        // Track usage (user or guest)
        try {
            db.prepare(`
                INSERT INTO usage_tracking (user_id, fingerprint, operation, model, created_at)
                VALUES (?, ?, 'upscale', ?, datetime('now'))
            `).run(userId, fingerprint, `${finalScale}x`);
        } catch (err) {
            console.error('Failed to log usage:', err);
        }

        res.download(outputPath, `upscaled_${finalModelType}_${finalScale}x_${originalFilename}`, (err) => {
            if (err) console.error(err);
            // Clean up input file
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            // Clean up processed file after a delay
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }, 60000);
        });

    } catch (err) {
        console.error('GPU upscale failed:', err);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        return res.status(500).json({
            error: 'Image processing failed',
            message: err.message || 'An error occurred during upscaling.',
        });
    }
});

module.exports = router;
