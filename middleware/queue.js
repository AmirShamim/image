let activeProcesses = 0;
const MAX_CONCURRENT_PROCESSES = 3; // Limit concurrent image processing

const queueMiddleware = (req, res, next) => {
    if (activeProcesses >= MAX_CONCURRENT_PROCESSES) {
        return res.status(503).json({
            error: 'Server is busy processing other requests. Please try again in a few seconds.',
            retryAfter: 5,
            queueStatus: { active: activeProcesses, max: MAX_CONCURRENT_PROCESSES }
        });
    }
    activeProcesses++;

    // Decrement counter when response finishes
    res.on('finish', () => {
        activeProcesses = Math.max(0, activeProcesses - 1);
    });
    res.on('close', () => {
        activeProcesses = Math.max(0, activeProcesses - 1);
    });

    next();
};

const getActiveProcesses = () => activeProcesses;

module.exports = {
    queueMiddleware,
    getActiveProcesses,
    MAX_CONCURRENT_PROCESSES
};
