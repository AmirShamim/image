require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const database = require('./database-pg');
database.initializeDatabase().catch(err => console.error('Failed to initialize database:', err));

const { initAnalytics } = require('./routes/analytics');
initAnalytics(database);

const { globalLimiter, authLimiter } = require('./middleware/rateLimiters');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const stripeRoutes = require('./routes/stripe');
const { router: analyticsRoutes } = require('./routes/analytics');
const systemRoutes = require('./routes/system');
const imageRoutes = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('loca.lt') || origin.includes('ondigitalocean.app')) return callback(null, true);
        const allowedOrigins = ['https://image-navy-kappa-80.vercel.app', 'http://localhost:5173', 'http://localhost:5000'];
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

['uploads', 'processed'].forEach(dir => !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true }));

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/profile_pictures', express.static(path.join(__dirname, 'profile_pictures')));
app.use('/processed', express.static(path.join(__dirname, 'processed')));

app.use('/api', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/', imageRoutes);

// Serve React frontend in production (Render builds the frontend into client/vite-project/dist)
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    const clientDist = path.join(__dirname, 'client', 'vite-project', 'dist');
    app.use(express.static(clientDist));
    // For all unmatched routes, serve the React SPA
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
