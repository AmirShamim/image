const express = require('express');
const router = express.Router();
const database = require('../database-pg');
const { getActiveProcesses, MAX_CONCURRENT_PROCESSES } = require('../middleware/queue');

const isProduction = process.env.NODE_ENV === 'production';

// ============== HEALTH CHECK & MONITORING ==============
router.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const activeProcesses = getActiveProcesses();

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
        },
        memory: {
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        processing: {
            activeJobs: activeProcesses,
            maxConcurrent: MAX_CONCURRENT_PROCESSES,
            available: MAX_CONCURRENT_PROCESSES - activeProcesses
        },
        environment: isProduction ? 'production' : 'development'
    });
});

// Server stats endpoint (for admin dashboard)
router.get('/stats', (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
        memory: Math.round(memUsage.heapUsed / 1024 / 1024),
        activeProcesses: getActiveProcesses(),
        maxProcesses: MAX_CONCURRENT_PROCESSES,
        uptime: Math.floor(process.uptime()),
        database: database.isPostgres ? 'postgresql' : 'sqlite'
    });
});

module.exports = router;
