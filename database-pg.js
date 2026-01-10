/**
 * PostgreSQL Database Module for ImageStudio
 *
 * Supports both PostgreSQL (production) and SQLite (development fallback)
 * Provides backward-compatible API for existing SQLite code
 *
 * For PostgreSQL, set DATABASE_URL environment variable:
 *   DATABASE_URL=postgres://user:password@host:5432/database
 *
 * Free PostgreSQL options:
 *   - Supabase (500MB free)
 *   - Neon (3GB free)
 *   - Render PostgreSQL ($7/mo but 90-day free trial)
 *   - ElephantSQL (20MB free)
 */

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = !!process.env.DATABASE_URL;

let db;
let isPostgres = false;
let sqliteDb = null;

if (usePostgres) {
    // PostgreSQL for production
    const { Pool } = require('pg');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
        max: 10, // Maximum connections in pool
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    isPostgres = true;

    // Test connection
    pool.query('SELECT NOW()')
        .then(() => console.log('✅ PostgreSQL connected successfully'))
        .catch(err => console.error('❌ PostgreSQL connection error:', err.message));

    db = pool;
} else {
    // SQLite for local development
    const Database = require('better-sqlite3');
    const path = require('path');
    const fs = require('fs');

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    sqliteDb = new Database(path.join(dataDir, 'users.db'));
    db = sqliteDb;
    console.log('✅ SQLite connected (local development)');
}

// ============== BACKWARD COMPATIBLE WRAPPER ==============
// This wrapper provides the same API as better-sqlite3 but works with PostgreSQL

class PreparedStatement {
    constructor(sql) {
        this.sql = sql;
        this.pgSql = this.convertToPostgres(sql);
    }

    convertToPostgres(sql) {
        // Convert ? placeholders to $1, $2, etc.
        let paramIndex = 0;
        return sql.replace(/\?/g, () => `$${++paramIndex}`);
    }

    async runAsync(...params) {
        if (isPostgres) {
            const result = await db.query(this.pgSql, params);
            return { changes: result.rowCount, lastInsertRowid: null };
        } else {
            return sqliteDb.prepare(this.sql).run(...params);
        }
    }

    run(...params) {
        if (isPostgres) {
            // For PostgreSQL, we need async but return sync-like interface
            // Queue the query and return immediately
            db.query(this.pgSql, params).catch(err => {
                console.error('PostgreSQL query error:', err.message);
            });
            return { changes: 0, lastInsertRowid: null };
        } else {
            return sqliteDb.prepare(this.sql).run(...params);
        }
    }

    async getAsync(...params) {
        if (isPostgres) {
            const result = await db.query(this.pgSql, params);
            return result.rows[0] || null;
        } else {
            return sqliteDb.prepare(this.sql).get(...params);
        }
    }

    get(...params) {
        if (isPostgres) {
            // Synchronous get not supported for PostgreSQL
            // Return null and log warning
            console.warn('Synchronous get() called on PostgreSQL - use getAsync() instead');
            return null;
        } else {
            return sqliteDb.prepare(this.sql).get(...params);
        }
    }

    async allAsync(...params) {
        if (isPostgres) {
            const result = await db.query(this.pgSql, params);
            return result.rows;
        } else {
            return sqliteDb.prepare(this.sql).all(...params);
        }
    }

    all(...params) {
        if (isPostgres) {
            console.warn('Synchronous all() called on PostgreSQL - use allAsync() instead');
            return [];
        } else {
            return sqliteDb.prepare(this.sql).all(...params);
        }
    }
}

// Wrapper that provides backward compatible .prepare() method
const dbWrapper = {
    prepare: (sql) => new PreparedStatement(sql),

    exec: async (sql) => {
        if (isPostgres) {
            await db.query(sql);
        } else {
            sqliteDb.exec(sql);
        }
    },

    // Direct query method for async operations
    query: async (sql, params = []) => {
        if (isPostgres) {
            return await db.query(sql, params);
        } else {
            const stmt = new PreparedStatement(sql);
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                return { rows: stmt.all(...params) };
            } else {
                return { rows: [], rowCount: stmt.run(...params).changes };
            }
        }
    },

    // Get the raw database connection
    raw: () => isPostgres ? db : sqliteDb
};

// ============== INITIALIZATION ==============

const initializeDatabase = async () => {
    if (isPostgres) {
        await initializePostgres();
    } else {
        initializeSQLite();
    }
};

const initializePostgres = async () => {
    const client = await db.connect();
    try {
        await client.query(`
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                profile_picture TEXT,
                email_verified BOOLEAN DEFAULT FALSE,
                verification_code TEXT,
                verification_expires TIMESTAMP,
                subscription_tier TEXT DEFAULT 'free',
                subscription_expires TIMESTAMP,
                stripe_customer_id TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- User sessions
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- User images
            CREATE TABLE IF NOT EXISTS user_images (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                original_filename TEXT NOT NULL,
                stored_filename TEXT NOT NULL,
                thumbnail_filename TEXT,
                operation TEXT NOT NULL,
                file_size INTEGER,
                dimensions TEXT,
                cloud_url TEXT,
                cloud_public_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Usage tracking
            CREATE TABLE IF NOT EXISTS usage_tracking (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                fingerprint TEXT,
                operation TEXT NOT NULL,
                model TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Subscription plans
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price_monthly REAL,
                price_yearly REAL,
                upscale_2x_limit INTEGER,
                upscale_4x_limit INTEGER,
                max_resolution INTEGER,
                batch_enabled BOOLEAN DEFAULT FALSE,
                watermark BOOLEAN DEFAULT TRUE,
                priority_queue BOOLEAN DEFAULT FALSE
            );

            -- ============== ANALYTICS TABLES ==============

            -- Visitors (unique visitors tracking)
            CREATE TABLE IF NOT EXISTS visitors (
                id TEXT PRIMARY KEY,
                fingerprint TEXT UNIQUE NOT NULL,
                first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visit_count INTEGER DEFAULT 1,
                user_agent TEXT,
                country TEXT,
                city TEXT,
                device_type TEXT,
                browser TEXT,
                os TEXT,
                referrer TEXT,
                utm_source TEXT,
                utm_medium TEXT,
                utm_campaign TEXT
            );

            -- Page views
            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                visitor_id TEXT REFERENCES visitors(id),
                user_id TEXT REFERENCES users(id),
                page_path TEXT NOT NULL,
                page_title TEXT,
                referrer TEXT,
                session_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tool usage analytics
            CREATE TABLE IF NOT EXISTS tool_usage (
                id SERIAL PRIMARY KEY,
                visitor_id TEXT REFERENCES visitors(id),
                user_id TEXT REFERENCES users(id),
                tool_name TEXT NOT NULL,
                tool_action TEXT,
                input_file_size INTEGER,
                output_file_size INTEGER,
                processing_time_ms INTEGER,
                settings JSONB,
                success BOOLEAN DEFAULT TRUE,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Sessions (for tracking user journeys)
            CREATE TABLE IF NOT EXISTS analytics_sessions (
                id TEXT PRIMARY KEY,
                visitor_id TEXT REFERENCES visitors(id),
                user_id TEXT REFERENCES users(id),
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                page_count INTEGER DEFAULT 0,
                tool_uses INTEGER DEFAULT 0,
                duration_seconds INTEGER
            );

            -- Daily aggregated stats (for fast dashboard queries)
            CREATE TABLE IF NOT EXISTS daily_stats (
                date DATE PRIMARY KEY,
                unique_visitors INTEGER DEFAULT 0,
                returning_visitors INTEGER DEFAULT 0,
                new_visitors INTEGER DEFAULT 0,
                total_page_views INTEGER DEFAULT 0,
                total_tool_uses INTEGER DEFAULT 0,
                resize_uses INTEGER DEFAULT 0,
                upscale_uses INTEGER DEFAULT 0,
                batch_uses INTEGER DEFAULT 0,
                registered_users INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(fingerprint);
            CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
            CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
            CREATE INDEX IF NOT EXISTS idx_tool_usage_visitor ON tool_usage(visitor_id);
            CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON tool_usage(tool_name);
            CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage(created_at);
            CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON analytics_sessions(visitor_id);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `);

        // Insert default subscription plans
        const plans = await client.query('SELECT COUNT(*) as count FROM subscription_plans');
        if (parseInt(plans.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, upscale_2x_limit, upscale_4x_limit, max_resolution, batch_enabled, watermark, priority_queue)
                VALUES 
                    ('guest', 'Guest', 0, 0, 3, 1, 1080, FALSE, FALSE, FALSE),
                    ('free', 'Free', 0, 0, 5, 2, 2160, FALSE, FALSE, FALSE),
                    ('pro', 'Pro', 4.99, 49.99, 50, 20, 3840, TRUE, FALSE, TRUE),
                    ('business', 'Business', 14.99, 149.99, -1, 100, 7680, TRUE, FALSE, TRUE),
                    ('admin', 'Admin', 0, 0, -1, -1, -1, TRUE, FALSE, TRUE)
                ON CONFLICT (id) DO NOTHING
            `);
        }

        console.log('✅ PostgreSQL tables initialized');
    } finally {
        client.release();
    }
};

const initializeSQLite = () => {
    // Original SQLite initialization
    sqliteDb.exec(`
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
            role TEXT DEFAULT 'user',
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
            cloud_url TEXT,
            cloud_public_id TEXT,
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

        -- Analytics tables for SQLite
        CREATE TABLE IF NOT EXISTS visitors (
            id TEXT PRIMARY KEY,
            fingerprint TEXT UNIQUE NOT NULL,
            first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
            visit_count INTEGER DEFAULT 1,
            user_agent TEXT,
            country TEXT,
            city TEXT,
            device_type TEXT,
            browser TEXT,
            os TEXT,
            referrer TEXT,
            utm_source TEXT,
            utm_medium TEXT,
            utm_campaign TEXT
        );

        CREATE TABLE IF NOT EXISTS page_views (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT,
            user_id TEXT,
            page_path TEXT NOT NULL,
            page_title TEXT,
            referrer TEXT,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS tool_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT,
            user_id TEXT,
            tool_name TEXT NOT NULL,
            tool_action TEXT,
            input_file_size INTEGER,
            output_file_size INTEGER,
            processing_time_ms INTEGER,
            settings TEXT,
            success INTEGER DEFAULT 1,
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS analytics_sessions (
            id TEXT PRIMARY KEY,
            visitor_id TEXT,
            user_id TEXT,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ended_at DATETIME,
            page_count INTEGER DEFAULT 0,
            tool_uses INTEGER DEFAULT 0,
            duration_seconds INTEGER,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS daily_stats (
            date TEXT PRIMARY KEY,
            unique_visitors INTEGER DEFAULT 0,
            returning_visitors INTEGER DEFAULT 0,
            new_visitors INTEGER DEFAULT 0,
            total_page_views INTEGER DEFAULT 0,
            total_tool_uses INTEGER DEFAULT 0,
            resize_uses INTEGER DEFAULT 0,
            upscale_uses INTEGER DEFAULT 0,
            batch_uses INTEGER DEFAULT 0,
            registered_users INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_visitors_fingerprint ON visitors(fingerprint);
        CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_visitor ON tool_usage(visitor_id);
        CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON tool_usage(tool_name);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Add role column if not exists
    try { sqliteDb.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`); } catch (e) {}

    // Insert default plans
    try {
        const existingPlans = sqliteDb.prepare('SELECT COUNT(*) as count FROM subscription_plans').get();
        if (existingPlans.count === 0) {
            sqliteDb.exec(`
                INSERT INTO subscription_plans (id, name, price_monthly, price_yearly, upscale_2x_limit, upscale_4x_limit, max_resolution, batch_enabled, watermark, priority_queue)
                VALUES 
                    ('guest', 'Guest', 0, 0, 3, 1, 1080, 0, 0, 0),
                    ('free', 'Free', 0, 0, 5, 2, 2160, 0, 0, 0),
                    ('pro', 'Pro', 4.99, 49.99, 50, 20, 3840, 1, 0, 1),
                    ('business', 'Business', 14.99, 149.99, -1, 100, 7680, 1, 0, 1),
                    ('admin', 'Admin', 0, 0, -1, -1, -1, 1, 0, 1);
            `);
        }
    } catch (e) {}

    console.log('✅ SQLite tables initialized');
};

// ============== QUERY WRAPPER ==============
// Provides unified interface for both PostgreSQL and SQLite

const query = async (sql, params = []) => {
    if (isPostgres) {
        // PostgreSQL uses $1, $2, etc. for parameters
        const pgSql = sql.replace(/\?/g, (_, i) => `$${params.indexOf(_) + 1}`);
        const result = await db.query(sql, params);
        return result.rows;
    } else {
        // SQLite - synchronous
        const stmt = db.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            return stmt.all(...params);
        } else {
            return stmt.run(...params);
        }
    }
};

const queryOne = async (sql, params = []) => {
    if (isPostgres) {
        const result = await db.query(sql, params);
        return result.rows[0] || null;
    } else {
        return sqliteDb.prepare(sql).get(...params) || null;
    }
};

const execute = async (sql, params = []) => {
    if (isPostgres) {
        return await db.query(sql, params);
    } else {
        return sqliteDb.prepare(sql).run(...params);
    }
};

// ============== EXPORT ==============

// Export the wrapper as default for backward compatibility
// This allows existing code using db.prepare() to work
module.exports = dbWrapper;

// Also export additional helpers
module.exports.db = db;
module.exports.sqliteDb = sqliteDb;
module.exports.isPostgres = isPostgres;
module.exports.initializeDatabase = initializeDatabase;
module.exports.query = query;
module.exports.queryOne = queryOne;
module.exports.execute = execute;
