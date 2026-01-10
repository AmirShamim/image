/**
 * Analytics Routes and Tracking for ImageStudio
 *
 * Free, privacy-friendly analytics that tracks:
 * - Unique vs returning visitors
 * - Page views
 * - Tool usage (resize, upscale, batch)
 * - User journeys
 * - Daily/weekly/monthly stats
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import database (will be injected)
let db, isPostgres, queryOne, execute, query;

// Initialize with database reference
const initAnalytics = (database) => {
    db = database.db;
    isPostgres = database.isPostgres;
    queryOne = database.queryOne;
    execute = database.execute;
    query = database.query;
};

// ============== HELPER FUNCTIONS ==============

// Generate fingerprint from request (privacy-friendly)
const generateFingerprint = (req) => {
    const components = [
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        req.ip || req.connection?.remoteAddress || ''
    ];

    return crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex')
        .substring(0, 32);
};

// Parse user agent for device info
const parseUserAgent = (ua) => {
    if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };

    let device = 'desktop';
    if (/mobile/i.test(ua)) device = 'mobile';
    else if (/tablet|ipad/i.test(ua)) device = 'tablet';

    let browser = 'other';
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'chrome';
    else if (/firefox/i.test(ua)) browser = 'firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
    else if (/edge/i.test(ua)) browser = 'edge';
    else if (/msie|trident/i.test(ua)) browser = 'ie';

    let os = 'other';
    if (/windows/i.test(ua)) os = 'windows';
    else if (/macintosh|mac os/i.test(ua)) os = 'macos';
    else if (/linux/i.test(ua)) os = 'linux';
    else if (/android/i.test(ua)) os = 'android';
    else if (/iphone|ipad/i.test(ua)) os = 'ios';

    return { device, browser, os };
};

// Parse UTM parameters
const parseUTM = (url) => {
    try {
        const params = new URL(url, 'http://localhost').searchParams;
        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign')
        };
    } catch {
        return { utm_source: null, utm_medium: null, utm_campaign: null };
    }
};

// ============== TRACKING MIDDLEWARE ==============

const trackPageView = async (req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api/') ||
        req.path.startsWith('/processed/') ||
        req.path.startsWith('/profile_pictures/') ||
        req.path.match(/\.(js|css|png|jpg|ico|svg|woff|woff2)$/)) {
        return next();
    }

    try {
        const fingerprint = generateFingerprint(req);
        const userAgent = req.headers['user-agent'] || '';
        const { device, browser, os } = parseUserAgent(userAgent);
        const referrer = req.headers['referer'] || req.headers['referrer'] || null;
        const { utm_source, utm_medium, utm_campaign } = parseUTM(req.originalUrl);
        const sessionId = req.cookies?.session_id || req.headers['x-session-id'] || uuidv4();
        const userId = req.user?.userId || null;

        // Upsert visitor
        if (isPostgres) {
            await db.query(`
                INSERT INTO visitors (id, fingerprint, user_agent, device_type, browser, os, referrer, utm_source, utm_medium, utm_campaign)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (fingerprint) DO UPDATE SET
                    last_visit = CURRENT_TIMESTAMP,
                    visit_count = visitors.visit_count + 1
            `, [uuidv4(), fingerprint, userAgent, device, browser, os, referrer, utm_source, utm_medium, utm_campaign]);

            // Get visitor ID
            const visitor = await db.query('SELECT id FROM visitors WHERE fingerprint = $1', [fingerprint]);
            const visitorId = visitor.rows[0]?.id;

            // Record page view
            await db.query(`
                INSERT INTO page_views (visitor_id, user_id, page_path, referrer, session_id)
                VALUES ($1, $2, $3, $4, $5)
            `, [visitorId, userId, req.path, referrer, sessionId]);

        } else {
            // SQLite
            const existingVisitor = db.prepare('SELECT id, visit_count FROM visitors WHERE fingerprint = ?').get(fingerprint);

            if (existingVisitor) {
                db.prepare(`
                    UPDATE visitors SET last_visit = datetime('now'), visit_count = visit_count + 1 WHERE fingerprint = ?
                `).run(fingerprint);

                db.prepare(`
                    INSERT INTO page_views (visitor_id, user_id, page_path, referrer, session_id)
                    VALUES (?, ?, ?, ?, ?)
                `).run(existingVisitor.id, userId, req.path, referrer, sessionId);
            } else {
                const visitorId = uuidv4();
                db.prepare(`
                    INSERT INTO visitors (id, fingerprint, user_agent, device_type, browser, os, referrer, utm_source, utm_medium, utm_campaign)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(visitorId, fingerprint, userAgent, device, browser, os, referrer, utm_source, utm_medium, utm_campaign);

                db.prepare(`
                    INSERT INTO page_views (visitor_id, user_id, page_path, referrer, session_id)
                    VALUES (?, ?, ?, ?, ?)
                `).run(visitorId, userId, req.path, referrer, sessionId);
            }
        }
    } catch (error) {
        console.error('Analytics tracking error:', error.message);
    }

    next();
};

// ============== TOOL USAGE TRACKING ==============

const trackToolUsage = async (options) => {
    const {
        req,
        toolName,
        toolAction,
        inputFileSize,
        outputFileSize,
        processingTimeMs,
        settings,
        success = true,
        errorMessage = null
    } = options;

    try {
        const fingerprint = generateFingerprint(req);
        const userId = req.user?.userId || null;

        if (isPostgres) {
            // Get visitor ID
            const visitor = await db.query('SELECT id FROM visitors WHERE fingerprint = $1', [fingerprint]);
            const visitorId = visitor.rows[0]?.id || null;

            await db.query(`
                INSERT INTO tool_usage (visitor_id, user_id, tool_name, tool_action, input_file_size, output_file_size, processing_time_ms, settings, success, error_message)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [visitorId, userId, toolName, toolAction, inputFileSize, outputFileSize, processingTimeMs, JSON.stringify(settings), success, errorMessage]);
        } else {
            const visitor = db.prepare('SELECT id FROM visitors WHERE fingerprint = ?').get(fingerprint);
            const visitorId = visitor?.id || null;

            db.prepare(`
                INSERT INTO tool_usage (visitor_id, user_id, tool_name, tool_action, input_file_size, output_file_size, processing_time_ms, settings, success, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(visitorId, userId, toolName, toolAction, inputFileSize, outputFileSize, processingTimeMs, JSON.stringify(settings), success ? 1 : 0, errorMessage);
        }
    } catch (error) {
        console.error('Tool usage tracking error:', error.message);
    }
};

// ============== ANALYTICS API ROUTES ==============

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const period = req.query.period || '7d'; // 7d, 30d, 90d
        let days = 7;
        if (period === '30d') days = 30;
        if (period === '90d') days = 90;

        let stats;

        if (isPostgres) {
            // Total visitors
            const totalVisitors = await db.query('SELECT COUNT(*) as count FROM visitors');

            // Visitors in period
            const periodVisitors = await db.query(`
                SELECT COUNT(DISTINCT visitor_id) as count 
                FROM page_views 
                WHERE created_at > NOW() - INTERVAL '${days} days'
            `);

            // New vs returning in period
            const newVisitors = await db.query(`
                SELECT COUNT(*) as count FROM visitors
                WHERE first_visit > NOW() - INTERVAL '${days} days'
            `);

            // Page views in period
            const pageViews = await db.query(`
                SELECT COUNT(*) as count FROM page_views
                WHERE created_at > NOW() - INTERVAL '${days} days'
            `);

            // Tool usage breakdown
            const toolUsage = await db.query(`
                SELECT tool_name, COUNT(*) as count 
                FROM tool_usage
                WHERE created_at > NOW() - INTERVAL '${days} days'
                GROUP BY tool_name
                ORDER BY count DESC
            `);

            // Top pages
            const topPages = await db.query(`
                SELECT page_path, COUNT(*) as views
                FROM page_views
                WHERE created_at > NOW() - INTERVAL '${days} days'
                GROUP BY page_path
                ORDER BY views DESC
                LIMIT 10
            `);

            // Device breakdown
            const devices = await db.query(`
                SELECT device_type, COUNT(*) as count
                FROM visitors
                WHERE last_visit > NOW() - INTERVAL '${days} days'
                GROUP BY device_type
            `);

            // Browser breakdown
            const browsers = await db.query(`
                SELECT browser, COUNT(*) as count
                FROM visitors
                WHERE last_visit > NOW() - INTERVAL '${days} days'
                GROUP BY browser
                ORDER BY count DESC
                LIMIT 5
            `);

            // Daily trend
            const dailyTrend = await db.query(`
                SELECT DATE(created_at) as date, 
                       COUNT(DISTINCT visitor_id) as visitors,
                       COUNT(*) as page_views
                FROM page_views
                WHERE created_at > NOW() - INTERVAL '${days} days'
                GROUP BY DATE(created_at)
                ORDER BY date
            `);

            stats = {
                totalVisitors: parseInt(totalVisitors.rows[0].count),
                periodVisitors: parseInt(periodVisitors.rows[0].count),
                newVisitors: parseInt(newVisitors.rows[0].count),
                returningVisitors: parseInt(periodVisitors.rows[0].count) - parseInt(newVisitors.rows[0].count),
                pageViews: parseInt(pageViews.rows[0].count),
                toolUsage: toolUsage.rows,
                topPages: topPages.rows,
                devices: devices.rows,
                browsers: browsers.rows,
                dailyTrend: dailyTrend.rows,
                period
            };
        } else {
            // SQLite version
            const totalVisitors = db.prepare('SELECT COUNT(*) as count FROM visitors').get();
            const periodVisitors = db.prepare(`
                SELECT COUNT(DISTINCT visitor_id) as count 
                FROM page_views 
                WHERE created_at > datetime('now', '-${days} days')
            `).get();
            const newVisitors = db.prepare(`
                SELECT COUNT(*) as count FROM visitors
                WHERE first_visit > datetime('now', '-${days} days')
            `).get();
            const pageViews = db.prepare(`
                SELECT COUNT(*) as count FROM page_views
                WHERE created_at > datetime('now', '-${days} days')
            `).get();
            const toolUsage = db.prepare(`
                SELECT tool_name, COUNT(*) as count 
                FROM tool_usage
                WHERE created_at > datetime('now', '-${days} days')
                GROUP BY tool_name
                ORDER BY count DESC
            `).all();
            const topPages = db.prepare(`
                SELECT page_path, COUNT(*) as views
                FROM page_views
                WHERE created_at > datetime('now', '-${days} days')
                GROUP BY page_path
                ORDER BY views DESC
                LIMIT 10
            `).all();
            const devices = db.prepare(`
                SELECT device_type, COUNT(*) as count
                FROM visitors
                WHERE last_visit > datetime('now', '-${days} days')
                GROUP BY device_type
            `).all();
            const browsers = db.prepare(`
                SELECT browser, COUNT(*) as count
                FROM visitors
                WHERE last_visit > datetime('now', '-${days} days')
                GROUP BY browser
                ORDER BY count DESC
                LIMIT 5
            `).all();
            const dailyTrend = db.prepare(`
                SELECT DATE(created_at) as date, 
                       COUNT(DISTINCT visitor_id) as visitors,
                       COUNT(*) as page_views
                FROM page_views
                WHERE created_at > datetime('now', '-${days} days')
                GROUP BY DATE(created_at)
                ORDER BY date
            `).all();

            stats = {
                totalVisitors: totalVisitors.count,
                periodVisitors: periodVisitors.count,
                newVisitors: newVisitors.count,
                returningVisitors: periodVisitors.count - newVisitors.count,
                pageViews: pageViews.count,
                toolUsage,
                topPages,
                devices,
                browsers,
                dailyTrend,
                period
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Get real-time stats (last hour)
router.get('/realtime', async (req, res) => {
    try {
        let stats;

        if (isPostgres) {
            const activeVisitors = await db.query(`
                SELECT COUNT(DISTINCT visitor_id) as count
                FROM page_views
                WHERE created_at > NOW() - INTERVAL '5 minutes'
            `);

            const hourlyViews = await db.query(`
                SELECT COUNT(*) as count
                FROM page_views
                WHERE created_at > NOW() - INTERVAL '1 hour'
            `);

            const recentPages = await db.query(`
                SELECT page_path, COUNT(*) as views
                FROM page_views
                WHERE created_at > NOW() - INTERVAL '1 hour'
                GROUP BY page_path
                ORDER BY views DESC
                LIMIT 5
            `);

            stats = {
                activeVisitors: parseInt(activeVisitors.rows[0].count),
                hourlyViews: parseInt(hourlyViews.rows[0].count),
                recentPages: recentPages.rows
            };
        } else {
            const activeVisitors = db.prepare(`
                SELECT COUNT(DISTINCT visitor_id) as count
                FROM page_views
                WHERE created_at > datetime('now', '-5 minutes')
            `).get();

            const hourlyViews = db.prepare(`
                SELECT COUNT(*) as count
                FROM page_views
                WHERE created_at > datetime('now', '-1 hour')
            `).get();

            const recentPages = db.prepare(`
                SELECT page_path, COUNT(*) as views
                FROM page_views
                WHERE created_at > datetime('now', '-1 hour')
                GROUP BY page_path
                ORDER BY views DESC
                LIMIT 5
            `).all();

            stats = {
                activeVisitors: activeVisitors.count,
                hourlyViews: hourlyViews.count,
                recentPages
            };
        }

        res.json(stats);
    } catch (error) {
        console.error('Realtime stats error:', error);
        res.status(500).json({ error: 'Failed to fetch realtime stats' });
    }
});

// Track page view from frontend
router.post('/pageview', async (req, res) => {
    try {
        const { path, title, referrer } = req.body;
        const fingerprint = generateFingerprint(req);
        const userAgent = req.headers['user-agent'] || '';
        const { device, browser, os } = parseUserAgent(userAgent);
        const sessionId = req.body.sessionId || uuidv4();
        const userId = req.user?.userId || null;

        if (isPostgres) {
            // Upsert visitor
            await db.query(`
                INSERT INTO visitors (id, fingerprint, user_agent, device_type, browser, os)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (fingerprint) DO UPDATE SET
                    last_visit = CURRENT_TIMESTAMP,
                    visit_count = visitors.visit_count + 1
            `, [uuidv4(), fingerprint, userAgent, device, browser, os]);

            const visitor = await db.query('SELECT id FROM visitors WHERE fingerprint = $1', [fingerprint]);
            const visitorId = visitor.rows[0]?.id;

            await db.query(`
                INSERT INTO page_views (visitor_id, user_id, page_path, page_title, referrer, session_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [visitorId, userId, path, title, referrer, sessionId]);
        } else {
            let visitorId;
            const existingVisitor = db.prepare('SELECT id FROM visitors WHERE fingerprint = ?').get(fingerprint);

            if (existingVisitor) {
                visitorId = existingVisitor.id;
                db.prepare(`UPDATE visitors SET last_visit = datetime('now'), visit_count = visit_count + 1 WHERE id = ?`).run(visitorId);
            } else {
                visitorId = uuidv4();
                db.prepare(`
                    INSERT INTO visitors (id, fingerprint, user_agent, device_type, browser, os)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(visitorId, fingerprint, userAgent, device, browser, os);
            }

            db.prepare(`
                INSERT INTO page_views (visitor_id, user_id, page_path, page_title, referrer, session_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(visitorId, userId, path, title, referrer, sessionId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Page view tracking error:', error);
        res.status(500).json({ error: 'Failed to track page view' });
    }
});

// Track tool usage from frontend
router.post('/tool', async (req, res) => {
    try {
        const {
            toolName,
            toolAction,
            inputFileSize,
            outputFileSize,
            processingTimeMs,
            settings,
            success,
            errorMessage
        } = req.body;

        await trackToolUsage({
            req,
            toolName,
            toolAction,
            inputFileSize,
            outputFileSize,
            processingTimeMs,
            settings,
            success,
            errorMessage
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Tool tracking error:', error);
        res.status(500).json({ error: 'Failed to track tool usage' });
    }
});

module.exports = {
    router,
    initAnalytics,
    trackPageView,
    trackToolUsage,
    generateFingerprint
};

