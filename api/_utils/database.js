const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'denla',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    charset: 'utf8mb4',
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Log configuration status (without exposing password)
console.log('MySQL Config Status:', {
    hasHost: !!dbConfig.host,
    hasUser: !!dbConfig.user,
    hasPassword: !!dbConfig.password,
    hasDatabase: !!dbConfig.database,
    host: dbConfig.host,
    database: dbConfig.database
});

// Create connection pool
let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
        console.log('MySQL connection pool created');
    }
    return pool;
}

// Execute query
async function query(sql, params = []) {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error.message);
        console.error('SQL:', sql);
        throw error;
    }
}

// Execute query and return single row
async function queryOne(sql, params = []) {
    try {
        const rows = await query(sql, params);
        return rows[0] || null;
    } catch (error) {
        throw error;
    }
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Test connection
async function testConnection() {
    try {
        const pool = getPool();
        const connection = await pool.getConnection();
        console.log('✅ MySQL connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);
        return false;
    }
}

module.exports = {
    query,
    queryOne,
    generateUUID,
    testConnection,
    getPool
};
