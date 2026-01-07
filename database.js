const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'users.db'));

// Initialize database tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile_picture TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_images (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        thumbnail_filename TEXT,
        operation TEXT NOT NULL,
        file_size INTEGER,
        dimensions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
`);

// Add profile_picture column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE users ADD COLUMN profile_picture TEXT`);
} catch (e) {
    // Column already exists
}

// Add thumbnail_filename column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE user_images ADD COLUMN thumbnail_filename TEXT`);
} catch (e) {
    // Column already exists
}

// Add file_size column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE user_images ADD COLUMN file_size INTEGER`);
} catch (e) {
    // Column already exists
}

// Add dimensions column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE user_images ADD COLUMN dimensions TEXT`);
} catch (e) {
    // Column already exists
}

// Create indexes for better performance
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON user_images(user_id);
`);

module.exports = db;
