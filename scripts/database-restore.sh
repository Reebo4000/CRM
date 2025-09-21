#!/bin/bash

# Database Restore Script for CRM System
# This script restores the PostgreSQL database from a backup

set -e

# Configuration
DB_NAME="crm_production"
DB_USER="crm_user"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="./backups"

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [backup_file]"
    echo ""
    echo "If no backup file is specified, the script will show available backups"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Show available backups"
    echo "  $0 crm_backup_20231201_120000.sql.gz # Restore specific backup"
}

# If no argument provided, show available backups
if [ $# -eq 0 ]; then
    print_status "Available backup files:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        BACKUPS=$(find "$BACKUP_DIR" -name "crm_backup_*.sql*" -type f | sort -r)
        
        if [ -z "$BACKUPS" ]; then
            print_warning "No backup files found in $BACKUP_DIR"
            exit 1
        fi
        
        echo "Recent backups:"
        echo "$BACKUPS" | head -10 | while read -r backup; do
            FILENAME=$(basename "$backup")
            SIZE=$(du -h "$backup" | cut -f1)
            MODIFIED=$(stat -c %y "$backup" | cut -d. -f1)
            echo "  $FILENAME (Size: $SIZE, Modified: $MODIFIED)"
        done
        
        echo ""
        echo "To restore a backup, run:"
        echo "  $0 <backup_filename>"
    else
        print_error "Backup directory $BACKUP_DIR does not exist"
        exit 1
    fi
    
    exit 0
fi

# Get backup file from argument
BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_DIR/$BACKUP_FILE"
    exit 1
fi

FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

print_warning "⚠️  WARNING: This will completely replace the current database!"
print_warning "Database: $DB_NAME"
print_warning "Backup file: $FULL_BACKUP_PATH"
print_warning ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Restore cancelled by user"
    exit 0
fi

print_status "Starting database restore..."

# Check if backup file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    print_status "Backup file is compressed, decompressing..."
    TEMP_FILE="/tmp/crm_restore_temp.sql"
    
    if gunzip -c "$FULL_BACKUP_PATH" > "$TEMP_FILE"; then
        print_success "Backup decompressed successfully"
        RESTORE_FILE="$TEMP_FILE"
    else
        print_error "Failed to decompress backup file"
        exit 1
    fi
else
    RESTORE_FILE="$FULL_BACKUP_PATH"
fi

# Drop existing database (be very careful!)
print_status "Dropping existing database..."
dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null || print_warning "Database might not exist"

# Create new database
print_status "Creating new database..."
if createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"; then
    print_success "Database created successfully"
else
    print_error "Failed to create database"
    exit 1
fi

# Restore database from backup
print_status "Restoring database from backup..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"; then
    print_success "Database restored successfully"
else
    print_error "Failed to restore database"
    exit 1
fi

# Clean up temporary file if created
if [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
    print_status "Temporary files cleaned up"
fi

# Log the restore operation
LOG_FILE="$BACKUP_DIR/restore.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Database restored from: $BACKUP_FILE" >> "$LOG_FILE"

print_success "Database restore completed successfully"
print_warning "⚠️  Remember to restart your application services"
