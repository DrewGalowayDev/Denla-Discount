const mysql = require('mysql2/promise');

// Validate environment variables
const missing = [];
if (!process.env.DB_HOST) missing.push('DB_HOST');
if (!process.env.DB_USER) missing.push('DB_USER');
if (!process.env.DB_PASSWORD) missing.push('DB_PASSWORD');
if (!process.env.DB_NAME) missing.push('DB_NAME');

if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing MySQL env var(s): ${missing.join(', ')}`);
    console.warn('Please copy backend/.env.example to backend/.env and fill in the MySQL values.');
}

// MySQL connection pool configuration
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'denla',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+00:00', // Store as UTC
    charset: 'utf8mb4',
    dateStrings: false, // Return dates as Date objects
    multipleStatements: false, // Security: prevent SQL injection via multiple statements
    namedPlaceholders: true // Enable named placeholders (:name)
};

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        console.log(`📊 Database: ${process.env.DB_NAME || 'denla'}`);
        console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL Database connection failed:', error.message);
        console.error('Please ensure MySQL is running and credentials are correct.');
        return false;
    }
};

// Helper function to execute queries with error handling
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('Database query error:', error.message);
        console.error('SQL:', sql);
        throw error;
    }
};

// Helper function to execute queries and return first row
const queryOne = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows[0] || null;
    } catch (error) {
        console.error('Database query error:', error.message);
        console.error('SQL:', sql);
        throw error;
    }
};

// Helper function for transactions
const transaction = async (callback) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        const result = await callback(connection);
        await connection.commit();
        connection.release();
        return result;
    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
};

// Helper function to generate UUID (compatible with MySQL UUID())
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔄 Closing MySQL connection pool...');
    await pool.end();
    console.log('✅ MySQL connection pool closed');
    process.exit(0);
});

module.exports = {
    pool,
    query,
    queryOne,
    transaction,
    generateUUID,
    testConnection
};
