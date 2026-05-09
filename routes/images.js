const express = require('express');
const router = express.Router();
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = require('../database-pg');
const { todayFilter } = require('../database-pg');
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
            const user = await db.prepare('SELECT subscription_tier FROM users WHERE id = ?').getAsync(userId);
            if (user && user.subscription_tier) {
                subscriptionTier = user.subscription_tier;
            }
        } catch (err) {
            console.error('Failed to get user subscription:', err);
        }
    }

    // Get plan limits
    const plan = await db.prepare('SELECT * FROM subscription_plans WHERE id = ?').getAsync(subscriptionTier);
    const dailyLimit = finalScale === 2
        ? (plan?.upscale_2x_limit ?? 3)
        : (plan?.upscale_4x_limit ?? 1);

    // All models now available to all users (Guest/Free/Pro)
    // removed explicit block for realesrgan Model

    // -1 means unlimited; skip limits entirely in dev mode or for admins
    if (dailyLimit !== -1 && isProduction && !isAdminRequest(req)) {
        // Count today's usage
        let usageCount = 0;
        try {
            if (userId) {
                const result = await db.prepare(`
                    SELECT COUNT(*) as count
                    FROM usage_tracking
                    WHERE user_id = ? AND model = ? AND ${todayFilter('created_at')}
                `).getAsync(userId, `${finalScale}x`);
                usageCount = result?.count || 0;
            } else if (fingerprint) {
                const result = await db.prepare(`
                    SELECT COUNT(*) as count
                    FROM usage_tracking
                    WHERE fingerprint = ? AND model = ? AND ${todayFilter('created_at')}
                `).getAsync(fingerprint, `${finalScale}x`);
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

    // ============== DIMENSION CHECK & TILING ==============
    // Tier-based dimension limits (server-side tiling handles large images for paid tiers)
    let tileSize = 512; // Default tile size for GPU processing
    const sharp = require('sharp');
    let imageWidth = 0, imageHeight = 0;

    try {
        const metadata = await sharp(inputPath).metadata();
        imageWidth = metadata.width;
        imageHeight = metadata.height;
        const maxDim = Math.max(imageWidth, imageHeight);

        // Dimension limits per tier — these match what Modal can handle with tiling
        // Guest/Free use the same limits as original (2048 for 4x, 3840 for 2x)
        const dimensionLimits = {
            guest:    { '2': 3840, '4': 2048 },
            free:     { '2': 3840, '4': 2048 },
            pro:      { '2': 4096, '4': 3072 },   // Tiling enabled, higher limits
            business: { '2': 8192, '4': 4096 },   // Large tiling enabled
        };

        const tierLimits = dimensionLimits[subscriptionTier] || dimensionLimits.guest;
        const maxDimension = tierLimits[String(finalScale)] || 2048;

        // Only enforce dimension limits in production (dev mode always allows processing)
        if (isProduction && maxDim > maxDimension) {
            fs.unlinkSync(inputPath);
            const canUpgrade = subscriptionTier === 'guest' || subscriptionTier === 'free';
            return res.status(400).json({
                error: 'Image too large for this scale',
                message: canUpgrade
                    ? `${finalScale}x upscaling on ${subscriptionTier} tier supports images up to ${maxDimension}px. Your image is ${imageWidth}×${imageHeight}px. Upgrade to Pro for larger images with tiling.`
                    : `${finalScale}x upscaling supports images up to ${maxDimension}px on your plan. Your image is ${imageWidth}×${imageHeight}px.`,
                limit: maxDimension,
                imageWidth,
                imageHeight,
                upgradeUrl: canUpgrade ? '/pricing' : undefined
            });
        }

        // Auto-adjust tile size based on image dimensions
        // T4 GPU (16GB VRAM) handles up to ~2048px in one pass without OOM
        // Only enable tiling for images that genuinely need it
        if (maxDim > 4096) {
            tileSize = 256;
        } else if (maxDim > 2048) {
            tileSize = 384;
        } else {
            tileSize = 0;  // No tiling — single-pass is faster for images ≤2048px
        }

    } catch (err) {
        console.error('Failed to check image dimensions:', err);
    }

    // ============== GPU PROVIDER UPSCALE ==============
    const startTime = Date.now();
    try {
        console.log(`[Upscale] Starting GPU upscale (${imageWidth}×${imageHeight} → ${finalScale}x, model=${finalModelType})...`);
        const result = await gpuProvider.upscale(inputPath, outputPath, {
            model: finalModelType,
            scale: finalScale,
            tileSize: tileSize,
        });

        const gpuTime = Date.now() - startTime;
        console.log(`[Upscale] ✅ GPU done in ${(gpuTime / 1000).toFixed(1)}s — ${result.width}×${result.height} via ${result.provider}`);

        let cloudUrl = null;
        let cloudPublicId = null;

        // Upload to Cloudinary if user is authenticated and Cloudinary is configured
        if (req.user && isCloudinaryConfigured()) {
            const cloudStart = Date.now();
            try {
                const cloudResult = await uploadToCloudinary(outputPath, {
                    public_id: `upscale_${req.user.userId}_${Date.now()}`
                });
                if (cloudResult.success) {
                    cloudUrl = cloudResult.url;
                    cloudPublicId = cloudResult.publicId;
                    console.log(`[Upscale] ☁️ Cloudinary upload in ${(Date.now() - cloudStart) / 1000}s`);
                }
            } catch (err) {
                console.error('[Upscale] Cloudinary upload failed:', err.message);
            }
        }

        // Log image operation (non-blocking — don't await, just fire and forget)
        if (req.user) {
            const imageId = uuidv4();
            db.prepare(`
                INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation, cloud_url,
                                         cloud_public_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).runAsync(
                imageId,
                req.user.userId,
                originalFilename,
                `${req.file.filename}_upscaled_${finalModelType}_${finalScale}x.png`,
                'upscale',
                cloudUrl,
                cloudPublicId
            ).catch(err => console.error('[Upscale] DB image log failed:', err.message));
        }

        // Track usage (non-blocking)
        const trackingId = uuidv4();
        db.prepare(`
            INSERT INTO usage_tracking (id, user_id, fingerprint, operation, model, created_at)
            VALUES (?, ?, ?, 'upscale', ?, CURRENT_TIMESTAMP)
        `).runAsync(trackingId, userId, fingerprint, `${finalScale}x`)
            .catch(err => console.error('[Upscale] Usage tracking failed:', err.message));

        // Send file to client
        const totalTime = Date.now() - startTime;
        console.log(`[Upscale] 📤 Sending file to client (total pipeline: ${(totalTime / 1000).toFixed(1)}s)...`);

        res.download(outputPath, `upscaled_${finalModelType}_${finalScale}x_${originalFilename}`, (err) => {
            if (err) console.error('[Upscale] Download error:', err.message);
            else console.log(`[Upscale] ✅ Download complete (total: ${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
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
