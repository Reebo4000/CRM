#!/usr/bin/env node

/**
 * Automated Backup System for CRM
 * Handles database backups, file backups, and cleanup
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'crm_production',
    user: process.env.DB_USER || 'crm_user',
    password: process.env.DB_PASSWORD
  },
  backup: {
    directory: process.env.BACKUP_PATH || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    compression: true
  },
  notifications: {
    email: process.env.BACKUP_NOTIFICATION_EMAIL,
    webhook: process.env.BACKUP_WEBHOOK_URL
  }
};

// Logging utility
const log = {
  info: (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data);
  },
  error: (message, error = {}) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  },
  success: (message, data = {}) => {
    console.log(`[${new Date().toISOString()}] SUCCESS: ${message}`, data);
  }
};

// Ensure backup directory exists
function ensureBackupDirectory() {
  if (!fs.existsSync(config.backup.directory)) {
    fs.mkdirSync(config.backup.directory, { recursive: true });
    log.info('Created backup directory', { path: config.backup.directory });
  }
}

// Generate backup filename
function generateBackupFilename(type = 'database') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  return `crm_${type}_backup_${timestamp}`;
}

// Database backup
async function backupDatabase() {
  try {
    log.info('Starting database backup...');
    
    const filename = generateBackupFilename('database');
    const backupPath = path.join(config.backup.directory, `${filename}.sql`);
    
    // Create pg_dump command
    const dumpCommand = [
      'pg_dump',
      `-h ${config.database.host}`,
      `-p ${config.database.port}`,
      `-U ${config.database.user}`,
      `-d ${config.database.name}`,
      `> "${backupPath}"`
    ].join(' ');
    
    // Set password environment variable
    const env = { ...process.env, PGPASSWORD: config.database.password };
    
    // Execute backup
    await execAsync(dumpCommand, { env });
    
    // Compress if enabled
    if (config.backup.compression) {
      await execAsync(`gzip "${backupPath}"`);
      const compressedPath = `${backupPath}.gz`;
      
      // Get file size
      const stats = fs.statSync(compressedPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      log.success('Database backup completed', {
        file: compressedPath,
        size: `${fileSizeMB} MB`
      });
      
      return compressedPath;
    } else {
      const stats = fs.statSync(backupPath);
      const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      log.success('Database backup completed', {
        file: backupPath,
        size: `${fileSizeMB} MB`
      });
      
      return backupPath;
    }
    
  } catch (error) {
    log.error('Database backup failed', error);
    throw error;
  }
}

// File system backup (uploads, logs, etc.)
async function backupFiles() {
  try {
    log.info('Starting file system backup...');
    
    const filename = generateBackupFilename('files');
    const backupPath = path.join(config.backup.directory, `${filename}.tar.gz`);
    
    // Directories to backup
    const dirsToBackup = [
      './backend/uploads',
      './backend/logs',
      './ssl'
    ].filter(dir => fs.existsSync(dir));
    
    if (dirsToBackup.length === 0) {
      log.info('No files to backup');
      return null;
    }
    
    // Create tar command
    const tarCommand = `tar -czf "${backupPath}" ${dirsToBackup.join(' ')}`;
    
    await execAsync(tarCommand);
    
    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log.success('File system backup completed', {
      file: backupPath,
      size: `${fileSizeMB} MB`,
      directories: dirsToBackup
    });
    
    return backupPath;
    
  } catch (error) {
    log.error('File system backup failed', error);
    throw error;
  }
}

// Clean up old backups
async function cleanupOldBackups() {
  try {
    log.info('Starting backup cleanup...');
    
    const files = fs.readdirSync(config.backup.directory);
    const now = Date.now();
    const retentionMs = config.backup.retentionDays * 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(config.backup.directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > retentionMs) {
        totalSize += stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
        log.info('Deleted old backup', { file });
      }
    }
    
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    log.success('Backup cleanup completed', {
      deletedFiles: deletedCount,
      freedSpace: `${totalSizeMB} MB`
    });
    
  } catch (error) {
    log.error('Backup cleanup failed', error);
    throw error;
  }
}

// Send notification
async function sendNotification(success, details) {
  try {
    if (config.notifications.webhook) {
      const payload = {
        timestamp: new Date().toISOString(),
        service: 'CRM Backup System',
        status: success ? 'success' : 'failure',
        details
      };
      
      // Send webhook notification (implement based on your webhook service)
      log.info('Notification sent', { webhook: config.notifications.webhook });
    }
    
    if (config.notifications.email) {
      // Send email notification (implement based on your email service)
      log.info('Email notification sent', { email: config.notifications.email });
    }
    
  } catch (error) {
    log.error('Failed to send notification', error);
  }
}

// Main backup function
async function performBackup() {
  const startTime = Date.now();
  let success = false;
  const results = {
    database: null,
    files: null,
    cleanup: null,
    duration: null,
    error: null
  };
  
  try {
    log.info('=== Starting automated backup process ===');
    
    // Ensure backup directory exists
    ensureBackupDirectory();
    
    // Perform database backup
    results.database = await backupDatabase();
    
    // Perform file system backup
    results.files = await backupFiles();
    
    // Clean up old backups
    await cleanupOldBackups();
    results.cleanup = true;
    
    success = true;
    results.duration = Date.now() - startTime;
    
    log.success('=== Backup process completed successfully ===', {
      duration: `${results.duration}ms`,
      databaseBackup: results.database,
      filesBackup: results.files
    });
    
  } catch (error) {
    results.error = error.message;
    results.duration = Date.now() - startTime;
    
    log.error('=== Backup process failed ===', {
      duration: `${results.duration}ms`,
      error: error.message
    });
  }
  
  // Send notification
  await sendNotification(success, results);
  
  return results;
}

// Restore database from backup
async function restoreDatabase(backupFile) {
  try {
    log.info('Starting database restore...', { backupFile });
    
    const backupPath = path.join(config.backup.directory, backupFile);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Decompress if needed
    let sqlFile = backupPath;
    if (backupPath.endsWith('.gz')) {
      const decompressedPath = backupPath.replace('.gz', '');
      await execAsync(`gunzip -c "${backupPath}" > "${decompressedPath}"`);
      sqlFile = decompressedPath;
    }
    
    // Drop and recreate database
    const env = { ...process.env, PGPASSWORD: config.database.password };
    
    await execAsync(`dropdb -h ${config.database.host} -p ${config.database.port} -U ${config.database.user} ${config.database.name}`, { env });
    await execAsync(`createdb -h ${config.database.host} -p ${config.database.port} -U ${config.database.user} ${config.database.name}`, { env });
    
    // Restore database
    const restoreCommand = `psql -h ${config.database.host} -p ${config.database.port} -U ${config.database.user} -d ${config.database.name} < "${sqlFile}"`;
    await execAsync(restoreCommand, { env });
    
    // Clean up decompressed file if created
    if (sqlFile !== backupPath) {
      fs.unlinkSync(sqlFile);
    }
    
    log.success('Database restore completed', { backupFile });
    
  } catch (error) {
    log.error('Database restore failed', error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      performBackup();
      break;
      
    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('Usage: node backup-automation.js restore <backup-file>');
        process.exit(1);
      }
      restoreDatabase(backupFile);
      break;
      
    case 'schedule':
      log.info('Starting backup scheduler...', { schedule: config.backup.schedule });
      cron.schedule(config.backup.schedule, performBackup);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node backup-automation.js backup    - Perform backup now');
      console.log('  node backup-automation.js restore <file> - Restore from backup');
      console.log('  node backup-automation.js schedule  - Start backup scheduler');
      break;
  }
}

module.exports = {
  performBackup,
  restoreDatabase,
  backupDatabase,
  backupFiles,
  cleanupOldBackups
};
