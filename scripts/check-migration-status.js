#!/usr/bin/env node

/**
 * Check Database Migration Status
 * Shows applied migrations, pending migrations, and current schema state
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Reebo@2004',
    database: process.env.DB_NAME || 'gemini_crm',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  table: (data) => console.table(data)
};

// Check if SequelizeMeta table exists
async function checkMetaTable() {
  try {
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeMeta'
      );
    `);
    return results[0].exists;
  } catch (error) {
    log.error(`Error checking SequelizeMeta table: ${error.message}`);
    return false;
  }
}

// Get applied migrations
async function getAppliedMigrations() {
  try {
    const [results] = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name');
    return results.map(row => row.name);
  } catch (error) {
    log.error(`Error getting applied migrations: ${error.message}`);
    return [];
  }
}

// Get all migration files
async function getAllMigrationFiles() {
  const fs = require('fs');
  const migrationsPath = path.join(__dirname, '../backend/migrations');
  
  try {
    if (!fs.existsSync(migrationsPath)) {
      log.warning('Migrations directory not found');
      return [];
    }
    
    const files = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    return files;
  } catch (error) {
    log.error(`Error reading migration files: ${error.message}`);
    return [];
  }
}

// Get database tables
async function getDatabaseTables() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    return results;
  } catch (error) {
    log.error(`Error getting database tables: ${error.message}`);
    return [];
  }
}

// Get table columns
async function getTableColumns(tableName) {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);
    return results;
  } catch (error) {
    log.error(`Error getting columns for table ${tableName}: ${error.message}`);
    return [];
  }
}

// Get database indexes
async function getDatabaseIndexes() {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `);
    return results;
  } catch (error) {
    log.error(`Error getting database indexes: ${error.message}`);
    return [];
  }
}

// Main function
async function checkMigrationStatus() {
  try {
    log.header('🔍 DATABASE MIGRATION STATUS CHECK');
    
    // Test database connection
    log.info('Testing database connection...');
    await sequelize.authenticate();
    log.success('Database connection successful');
    
    // Check if SequelizeMeta table exists
    log.info('Checking SequelizeMeta table...');
    const metaTableExists = await checkMetaTable();
    
    if (!metaTableExists) {
      log.warning('SequelizeMeta table does not exist. No migrations have been run yet.');
      return;
    }
    
    // Get applied migrations
    log.header('📋 APPLIED MIGRATIONS');
    const appliedMigrations = await getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      log.warning('No migrations have been applied yet');
    } else {
      log.success(`${appliedMigrations.length} migrations have been applied:`);
      appliedMigrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration}`);
      });
    }
    
    // Get all migration files
    log.header('📁 MIGRATION FILES');
    const allMigrationFiles = await getAllMigrationFiles();
    
    if (allMigrationFiles.length === 0) {
      log.warning('No migration files found');
    } else {
      log.info(`Found ${allMigrationFiles.length} migration files:`);
      
      const migrationStatus = allMigrationFiles.map(file => {
        const isApplied = appliedMigrations.includes(file);
        return {
          'Migration File': file,
          'Status': isApplied ? '✅ Applied' : '❌ Pending',
          'Applied': isApplied
        };
      });
      
      log.table(migrationStatus);
      
      const pendingMigrations = migrationStatus.filter(m => !m.Applied);
      if (pendingMigrations.length > 0) {
        log.warning(`${pendingMigrations.length} pending migrations found`);
      } else {
        log.success('All migrations are up to date');
      }
    }
    
    // Get database schema
    log.header('🗄️ CURRENT DATABASE SCHEMA');
    const tables = await getDatabaseTables();
    
    if (tables.length === 0) {
      log.warning('No tables found in database');
    } else {
      log.success(`Found ${tables.length} tables:`);
      
      for (const table of tables) {
        console.log(`\n${colors.bright}Table: ${table.table_name}${colors.reset}`);
        const columns = await getTableColumns(table.table_name);
        
        if (columns.length > 0) {
          const columnInfo = columns.map(col => ({
            'Column': col.column_name,
            'Type': col.data_type + (col.character_maximum_length ? `(${col.character_maximum_length})` : ''),
            'Nullable': col.is_nullable === 'YES' ? 'Yes' : 'No',
            'Default': col.column_default || 'None'
          }));
          
          console.table(columnInfo);
        }
      }
    }
    
    // Get database indexes
    log.header('📊 DATABASE INDEXES');
    const indexes = await getDatabaseIndexes();
    
    if (indexes.length === 0) {
      log.warning('No indexes found');
    } else {
      const indexInfo = indexes.map(idx => ({
        'Table': idx.tablename,
        'Index Name': idx.indexname,
        'Definition': idx.indexdef.substring(0, 80) + (idx.indexdef.length > 80 ? '...' : '')
      }));
      
      log.table(indexInfo);
    }
    
    log.header('✅ MIGRATION STATUS CHECK COMPLETE');
    
  } catch (error) {
    log.error(`Migration status check failed: ${error.message}`);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run the check
if (require.main === module) {
  checkMigrationStatus();
}

module.exports = {
  checkMigrationStatus,
  getAppliedMigrations,
  getAllMigrationFiles,
  getDatabaseTables
};
