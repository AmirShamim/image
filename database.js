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
        email_verified INTEGER DEFAULT 0,
        verification_code TEXT,
        verification_expires DATETIME,
        subscription_tier TEXT DEFAULT 'free',
        subscription_expires DATETIME,
        stripe_customer_id TEXT,
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

    CREATE TABLE IF NOT EXISTS usage_tracking (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        fingerprint TEXT,
        operation TEXT NOT NULL,
        model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_monthly REAL,
        price_yearly REAL,
        upscale_2x_limit INTEGER,
        upscale_4x_limit INTEGER,
        max_resolution INTEGER,
        batch_enabled INTEGER DEFAULT 0,
        watermark INTEGER DEFAULT 1,
        priority_queue INTEGER DEFAULT 0
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

// Add cloud_url column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE user_images ADD COLUMN cloud_url TEXT`);
} catch (e) {
    // Column already exists
}

// Add cloud_public_id column if it doesn't exist (migration)
try {
    db.exec(`ALTER TABLE user_images ADD COLUMN cloud_public_id TEXT`);
} catch (e) {
    // Column already exists
}

// Add email verification columns (migration)
try { db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN verification_code TEXT`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN verification_expires DATETIME`); } catch (e) {}

// Add subscription columns (migration)
try { db.exec(`ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN subscription_expires DATETIME`); } catch (e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN stripe_customer_id TEXT`); } catch (e) {}

// Create indexes for better performance
db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_images_user_id ON user_images(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_tracking(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_fingerprint ON usage_tracking(fingerprint);
`);

// Insert default subscription plans
try {
    const existingPlans = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get();
    if (existingPlans.count === 0) {
        db.exec(`
            INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, upscale_2x_limit, upscale_4x_limit, max_resolution, batch_enabled, watermark, priority_queue)
            VALUES 
                ('guest', 'Guest', 0, 0, 3, 1, 1080, 0, 0, 0),
                ('free', 'Free', 0, 0, 5, 2, 2160, 0, 0, 0),
                ('pro', 'Pro', 4.99, 49.99, 50, 20, 3840, 1, 0, 1),
                ('business', 'Business', 14.99, 149.99, -1, 100, 7680, 1, 0, 1);
        `);
    }
} catch (e) {
    // Plans table might not exist yet
}

module.exports = db;
