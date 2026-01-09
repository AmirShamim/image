// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Import database (initializes tables)
const db = require('./database');

// Import Cloudinary config
const { uploadToCloudinary, isCloudinaryConfigured } = require('./config/cloudinary');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stripeRoutes = require('./routes/stripe');

// Import middleware
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Configure multer
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// CORS - allow all in production since we serve from same origin
app.use(cors());
app.use(express.json());

// Serve profile pictures statically
app.use('/profile_pictures', express.static(path.join(__dirname, 'profile_pictures')));

// Serve processed images for history thumbnails
app.use('/processed', express.static(path.join(__dirname, 'processed')));

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Stripe routes (webhook needs raw body, handled inside the route)
app.use('/api/stripe', stripeRoutes);

// Serve static files from React build in production
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/vite-project/dist')));
}

// Ensure directories exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}
if (!fs.existsSync('processed')) {
    fs.mkdirSync('processed', { recursive: true });
}

// Get image dimensions endpoint
app.post('/get-dimensions', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const inputPath = req.file.path;
    
    const pythonProcess = spawn('python', [
        '-c',
        `import cv2; import json; img = cv2.imread("${inputPath.replace(/\\/g, '\\\\')}"); h, w = img.shape[:2]; print(json.dumps({"width": w, "height": h}))`
    ]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        // Clean up the uploaded file
        fs.unlinkSync(inputPath);
        
        if (code !== 0) {
            return res.status(500).send('Failed to get dimensions.');
        }
        
        try {
            const dimensions = JSON.parse(output.trim());
            res.json(dimensions);
        } catch (e) {
            res.status(500).send('Failed to parse dimensions.');
        }
    });
});

// Upscale endpoint (AI-powered 2x/3x/4x upscaling with model selection)
app.post('/upscale', optionalAuth, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const inputPath = req.file.path;
    const originalFilename = req.file.originalname;
    
    // Parse scale (2x, 3x, 4x)
    const scaleInput = req.body.scale || req.body.model || '2x';
    const scale = scaleInput.replace('x', '');
    const validScales = ['2', '3', '4'];
    const finalScale = validScales.includes(scale) ? scale : '2';
    
    // Parse model type (realesrgan, realesrgan-fast, realesrgan-anime, edsr, fsrcnn, espcn)
    const modelType = req.body.modelType || 'realesrgan-fast';
    const validModels = ['realesrgan', 'realesrgan-fast', 'realesrgan-anime', 'edsr', 'fsrcnn', 'espcn'];
    const finalModelType = validModels.includes(modelType) ? modelType : 'realesrgan-fast';
    
    const outputPath = `processed/${req.file.filename}_upscaled_${finalModelType}_${finalScale}x.jpg`;

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
    const dailyLimit = finalScale === '2' 
        ? (plan?.upscale_2x_limit ?? 3) 
        : (plan?.upscale_4x_limit ?? 1);
    
    // Check if Real-ESRGAN Pro is allowed for this tier
    if (finalModelType === 'realesrgan' && !['pro', 'business'].includes(subscriptionTier)) {
        fs.unlinkSync(inputPath);
        return res.status(403).json({
            error: 'Model not available',
            message: 'Real-ESRGAN Pro model is only available for Pro and Business subscribers.',
            upgradeUrl: '/pricing'
        });
    }
    
    // -1 means unlimited
    if (dailyLimit !== -1) {
        // Count today's usage
        let usageCount = 0;
        try {
            if (userId) {
                const result = db.prepare(`
                    SELECT COUNT(*) as count FROM usage_tracking 
                    WHERE user_id = ? AND model = ? AND date(created_at) = date('now')
                `).get(userId, `${finalScale}x`);
                usageCount = result?.count || 0;
            } else if (fingerprint) {
                const result = db.prepare(`
                    SELECT COUNT(*) as count FROM usage_tracking 
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
    const maxFileSizeMB = subscriptionTier === 'business' ? 100 : 
                          subscriptionTier === 'pro' ? 25 : 
                          subscriptionTier === 'free' ? 10 : 5;
    
    if (req.file.size > maxFileSizeMB * 1024 * 1024) {
        fs.unlinkSync(inputPath);
        return res.status(413).json({
            error: 'File too large',
            message: `Max file size for ${subscriptionTier} tier is ${maxFileSizeMB}MB. Upgrade for larger files.`,
            maxSize: maxFileSizeMB * 1024 * 1024,
            fileSize: req.file.size
        });
    }

    // Check image dimensions for upscaling limits
    // 4x: max 1024px, 3x: max 1536px, 2x: max 2048px
    const sharp = require('sharp');
    try {
        const metadata = await sharp(inputPath).metadata();
        const sizeLimits = { '4': 1024, '3': 1536, '2': 2048 };
        const maxDimension = sizeLimits[finalScale] || 2048;
        
        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            fs.unlinkSync(inputPath);
            return res.status(400).json({
                error: 'Image too large for this scale',
                message: `${finalScale}x upscaling requires images ≤${maxDimension}px. Your image is ${metadata.width}×${metadata.height}px. Use a smaller scale or resize first.`,
                limit: maxDimension,
                imageWidth: metadata.width,
                imageHeight: metadata.height
            });
        }
    } catch (err) {
        console.error('Failed to check image dimensions:', err);
        // Continue anyway if we can't check dimensions
    }

    // Call Python script with model type, scale, and tier
    const pythonProcess = spawn('python', [
        'upscale_script.py',
        inputPath,
        outputPath,
        'upscale',
        JSON.stringify({ 
            model: `${finalScale}x`, 
            modelType: finalModelType,
            tier: subscriptionTier 
        })
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            fs.unlinkSync(inputPath);
            return res.status(500).send('Image processing failed.');
        }

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
                    INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation, cloud_url, cloud_public_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    imageId,
                    req.user.userId,
                    originalFilename,
                    `${req.file.filename}_upscaled_${finalModelType}_${finalScale}x.jpg`,
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
            fs.unlinkSync(inputPath);
            // Clean up processed file after a delay (keep if not uploaded to cloud)
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }, 60000);
        });
    });
});

// Resize endpoint (shrink/resize by pixels or percentage)
app.post('/resize', optionalAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const inputPath = req.file.path;
    const format = req.body.format || 'jpg';
    const outputPath = `processed/${req.file.filename}_resized.${format}`;
    const originalFilename = req.file.originalname;

    const options = {
        resizeType: req.body.resizeType || 'percentage',
        percentage: parseInt(req.body.percentage) || 100,
        width: parseInt(req.body.width) || 800,
        height: parseInt(req.body.height) || 600,
        maintainAspect: req.body.maintainAspect !== 'false',
        quality: parseInt(req.body.quality) || 90
    };

    console.log('Resize options:', options);

    const pythonProcess = spawn('python', [
        'upscale_script.py', 
        inputPath, 
        outputPath, 
        'resize',
        JSON.stringify(options)
    ]);

    let resultInfo = '';
    pythonProcess.stdout.on('data', (data) => {
        resultInfo += data.toString();
        console.log(`Python Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            fs.unlinkSync(inputPath);
            return res.status(500).send('Image processing failed.');
        }

        let cloudUrl = null;
        let cloudPublicId = null;

        // Upload to Cloudinary if user is authenticated and Cloudinary is configured
        if (req.user && isCloudinaryConfigured()) {
            try {
                const cloudResult = await uploadToCloudinary(outputPath, {
                    public_id: `resize_${req.user.userId}_${Date.now()}`
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
                    INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation, cloud_url, cloud_public_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    imageId,
                    req.user.userId,
                    originalFilename,
                    `${req.file.filename}_resized.${format}`,
                    'resize',
                    cloudUrl,
                    cloudPublicId
                );
            } catch (err) {
                console.error('Failed to log image operation:', err);
            }
        }

        res.download(outputPath, `resized_${originalFilename.replace(/\.[^.]+$/, '')}.${format}`, (err) => {
            if (err) console.error(err);
            fs.unlinkSync(inputPath);
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }, 60000);
        });
    });
});

// Serve React app for all other routes in production (Express 5 syntax)
if (isProduction) {
    app.get('/{*path}', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/vite-project/dist', 'index.html'));
    });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));