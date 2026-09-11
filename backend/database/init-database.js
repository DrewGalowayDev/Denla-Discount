#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes the MySQL database with schema and initial data
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createDatabase() {
    log('\n========================================', 'cyan');
    log('  MySQL Database Initialization', 'bright');
    log('========================================\n', 'cyan');

    // Connection config without database (to create it)
    const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT) || 3306,
        multipleStatements: true
    };

    const dbName = process.env.DB_NAME || 'denla';

    log(`📊 Configuration:`, 'cyan');
    log(`   Host: ${connectionConfig.host}:${connectionConfig.port}`);
    log(`   User: ${connectionConfig.user}`);
    log(`   Database: ${dbName}\n`);

    let connection;

    try {
        // Connect to MySQL server
        log('🔌 Connecting to MySQL server...', 'yellow');
        connection = await mysql.createConnection(connectionConfig);
        log('✅ Connected to MySQL server\n', 'green');

        // Check if database exists
        log('🔍 Checking if database exists...', 'yellow');
        const [databases] = await connection.query(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
            [dbName]
        );

        if (databases.length > 0) {
            log(`⚠️  Database "${dbName}" already exists!`, 'yellow');
            
            // Ask for confirmation (in production, you'd want proper prompting)
            log(`\nTo recreate the database, run:`, 'cyan');
            log(`  DROP DATABASE ${dbName};`, 'yellow');
            log(`  Then run this script again.\n`);
            
            await connection.end();
            return;
        }

        // Create database
        log(`📦 Creating database "${dbName}"...`, 'yellow');
        await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        log(`✅ Database "${dbName}" created successfully\n`, 'green');

        // Close connection and reconnect to the new database
        await connection.end();

        // Reconnect with database selected
        log('🔌 Connecting to new database...', 'yellow');
        connection = await mysql.createConnection({
            ...connectionConfig,
            database: dbName
        });
        log('✅ Connected to database\n', 'green');

        // Read and execute schema SQL file
        log('📝 Reading POS schema file...', 'yellow');
        const schemaPath = path.join(__dirname, 'mysql-schema-pos.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        log('✅ POS Schema file loaded\n', 'green');

        log('⚙️  Executing schema SQL...', 'yellow');
        log('   This may take a moment...\n');
        
        // Split and execute SQL statements (handling delimiters)
        const statements = schemaSql
            .split(/;\s*$(?!\n\s*\))/gm)
            .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

        let successCount = 0;
        for (const statement of statements) {
            const trimmed = statement.trim();
            if (trimmed.length > 0) {
                try {
                    await connection.query(trimmed);
                    successCount++;
                } catch (error) {
                    // Ignore some expected errors
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('Duplicate key name')) {
                        log(`   ⚠️  Warning: ${error.message}`, 'yellow');
                    }
                }
            }
        }
        
        log(`✅ Schema executed successfully (${successCount} statements)\n`, 'green');

        // Verify tables were created
        log('🔍 Verifying tables...', 'yellow');
        const [tables] = await connection.query('SHOW TABLES');
        log(`✅ Created ${tables.length} tables:\n`, 'green');
        
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            log(`   ✓ ${tableName}`, 'green');
        });

        log('\n========================================', 'cyan');
        log('  ✅ Database Initialization Complete!', 'green');
        log('========================================\n', 'cyan');

        log('📌 Next Steps:', 'cyan');
        log('   1. Run: node backend/database/seed-data.js');
        log('   2. Run: node backend/database/create-admin.js');
        log('   3. Start your server: npm run dev\n');

    } catch (error) {
        log('\n❌ Error during database initialization:', 'red');
        log(`   ${error.message}\n`, 'red');
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            log('💡 Tips:', 'yellow');
            log('   - Check your MySQL credentials in .env file');
            log('   - Ensure MySQL server is running');
            log('   - Verify user has CREATE DATABASE privileges\n');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the initialization
createDatabase();
