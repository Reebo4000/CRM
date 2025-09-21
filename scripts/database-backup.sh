#!/bin/bash

# Database Backup Script for CRM System
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
DB_NAME="crm_production"
DB_USER="crm_user"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/crm_backup_$TIMESTAMP.sql"

print_status "Starting database backup..."
print_status "Database: $DB_NAME"
print_status "Backup file: $BACKUP_FILE"

# Create database backup
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    print_success "Database backup created successfully"
    
    # Compress the backup
    if gzip "$BACKUP_FILE"; then
        BACKUP_FILE="$BACKUP_FILE.gz"
        print_success "Backup compressed: $BACKUP_FILE"
    else
        print_warning "Failed to compress backup, keeping uncompressed version"
    fi
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_status "Backup size: $BACKUP_SIZE"
    
else
    print_error "Failed to create database backup"
    exit 1
fi

# Clean up old backups (keep only last N days)
print_status "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "crm_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "crm_backup_*.sql*" -type f | wc -l)
print_success "Cleanup completed. $REMAINING_BACKUPS backup files remaining"

# Create backup log entry
LOG_FILE="$BACKUP_DIR/backup.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup created: $BACKUP_FILE (Size: $BACKUP_SIZE)" >> "$LOG_FILE"

print_success "Backup process completed successfully"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# print_status "Uploading backup to cloud storage..."
# aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/crm-backups/
# print_success "Backup uploaded to cloud storage"
