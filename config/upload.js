const multer = require('multer');

// Configure multer
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;
