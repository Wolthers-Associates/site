#!/bin/bash

# Wolthers & Associates - Database Backup Script
# This script creates automated backups of the trips database

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="${MYSQL_DATABASE:-wolthers_trips}"
DB_USER="root"
DB_PASS="$MYSQL_ROOT_PASSWORD"
DB_HOST="database"

# Retention policy (days)
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Wait for database to be ready
log "Waiting for database to be ready..."
until mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" --silent; do
    log "Database is unavailable - sleeping"
    sleep 1
done

log "Database is ready!"

# Create backup
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${DATE}.sql"
log "Creating backup: $BACKUP_FILE"

# Dump database with structure and data
if mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    "$DB_NAME" > "$BACKUP_FILE"; then
    
    success "Database backup created successfully"
    
    # Compress the backup
    log "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    success "Backup compressed successfully (Size: $BACKUP_SIZE)"
    
else
    error "Failed to create database backup"
    exit 1
fi

# Create a schema-only backup for reference
SCHEMA_FILE="$BACKUP_DIR/${DB_NAME}_schema_${DATE}.sql"
log "Creating schema backup: $SCHEMA_FILE"

if mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" \
    --no-data \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$SCHEMA_FILE"; then
    
    gzip "$SCHEMA_FILE"
    success "Schema backup created successfully"
else
    warning "Failed to create schema backup"
fi

# Cleanup old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "${DB_NAME}_schema_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f | wc -l)
log "Backup cleanup completed. $BACKUP_COUNT backups remaining."

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/backup_manifest.txt"
log "Updating backup manifest..."

{
    echo "# Wolthers & Associates - Database Backup Manifest"
    echo "# Generated: $(date)"
    echo "# Database: $DB_NAME"
    echo ""
    echo "Latest Backups:"
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -printf "%T@ %p\n" | sort -n | tail -10 | while read timestamp file; do
        date_str=$(date -d @"${timestamp%.*}" '+%Y-%m-%d %H:%M:%S')
        size=$(du -h "$file" | cut -f1)
        echo "$date_str - $(basename "$file") ($size)"
    done
} > "$MANIFEST_FILE"

# Test backup integrity (optional)
if [ "${VERIFY_BACKUP:-false}" = "true" ]; then
    log "Verifying backup integrity..."
    
    if zcat "$BACKUP_FILE" | head -20 | grep -q "MySQL dump"; then
        success "Backup integrity verified"
    else
        error "Backup integrity check failed"
        exit 1
    fi
fi

# Send notification (if configured)
if [ -n "$SLACK_WEBHOOK" ]; then
    log "Sending notification..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"text\":\"✅ Database backup completed successfully\",
            \"attachments\":[{
                \"color\":\"good\",
                \"fields\":[
                    {\"title\":\"Database\",\"value\":\"$DB_NAME\",\"short\":true},
                    {\"title\":\"Size\",\"value\":\"$BACKUP_SIZE\",\"short\":true},
                    {\"title\":\"Date\",\"value\":\"$(date)\",\"short\":false}
                ]
            }]
        }" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1 || warning "Failed to send notification"
fi

success "Backup process completed successfully!"
success "Backup file: $BACKUP_FILE"
success "Backup size: $BACKUP_SIZE"

# Exit successfully
exit 0 