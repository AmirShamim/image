const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Import database (initializes tables)
const db = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

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

// Upscale endpoint (AI-powered 4x upscaling)
app.post('/upscale', optionalAuth, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const inputPath = req.file.path;
    const outputPath = `processed/${req.file.filename}_upscaled.jpg`;
    const originalFilename = req.file.originalname;

    const pythonProcess = spawn('python', [
        'upscale_script.py', 
        inputPath, 
        outputPath, 
        'upscale',
        '{}'
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`Python Output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            fs.unlinkSync(inputPath);
            return res.status(500).send('Image processing failed.');
        }

        // Log image operation if user is authenticated
        if (req.user) {
            try {
                const imageId = uuidv4();
                db.prepare('INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation) VALUES (?, ?, ?, ?, ?)').run(
                    imageId,
                    req.user.userId,
                    originalFilename,
                    `${req.file.filename}_upscaled.jpg`,
                    'upscale'
                );
            } catch (err) {
                console.error('Failed to log image operation:', err);
            }
        }

        res.download(outputPath, (err) => {
            if (err) console.error(err);
            fs.unlinkSync(inputPath);
            // Optionally clean up processed file after a delay
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

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            fs.unlinkSync(inputPath);
            return res.status(500).send('Image processing failed.');
        }

        // Log image operation if user is authenticated
        if (req.user) {
            try {
                const imageId = uuidv4();
                db.prepare('INSERT INTO user_images (id, user_id, original_filename, stored_filename, operation) VALUES (?, ?, ?, ?, ?)').run(
                    imageId,
                    req.user.userId,
                    originalFilename,
                    `${req.file.filename}_resized.${format}`,
                    'resize'
                );
            } catch (err) {
                console.error('Failed to log image operation:', err);
            }
        }

        res.download(outputPath, `resized_image.${format}`, (err) => {
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