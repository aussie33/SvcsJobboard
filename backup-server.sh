#!/bin/bash

# Backup script for 64.225.6.33 Ubuntu server
# Run this script on your server BEFORE deploying the new version

set -e  # Exit on any error

echo "=== Career Portal Backup Script ==="
echo "Server: 64.225.6.33"
echo "Date: $(date)"
echo ""

# Configuration
BACKUP_BASE="/home/backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_BASE/career-portal-backup-$TIMESTAMP"
APP_DIR="/var/www/career-portal"
WEB_ROOT="/var/www/html"

# Create backup directory
echo "Creating backup directory..."
sudo mkdir -p "$BACKUP_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"

# Backup current application if it exists
if [ -d "$APP_DIR" ]; then
    echo "Backing up application files from $APP_DIR..."
    sudo cp -r "$APP_DIR" "$BACKUP_DIR/career-portal-app"
    echo "✓ Application files backed up"
else
    echo "! No application directory found at $APP_DIR"
fi

# Backup web root if it exists
if [ -d "$WEB_ROOT" ]; then
    echo "Backing up web root from $WEB_ROOT..."
    sudo cp -r "$WEB_ROOT" "$BACKUP_DIR/web-root"
    echo "✓ Web root backed up"
else
    echo "! No web root found at $WEB_ROOT"
fi

# Backup nginx configuration
if [ -d "/etc/nginx" ]; then
    echo "Backing up nginx configuration..."
    sudo cp -r /etc/nginx "$BACKUP_DIR/nginx-config"
    echo "✓ Nginx configuration backed up"
fi

# Backup any PM2 processes
if command -v pm2 &> /dev/null; then
    echo "Backing up PM2 configuration..."
    pm2 save
    cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2-processes.json" 2>/dev/null || echo "! No PM2 processes to backup"
fi

# Backup database if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    echo "Backing up PostgreSQL database..."
    sudo -u postgres pg_dumpall > "$BACKUP_DIR/postgresql-backup.sql"
    echo "✓ Database backed up"
fi

# Create backup summary
cat > "$BACKUP_DIR/backup-info.txt" << EOF
Career Portal Backup Summary
============================
Date: $(date)
Server: 64.225.6.33
Backup Directory: $BACKUP_DIR

Files Backed Up:
- Application: $([[ -d "$APP_DIR" ]] && echo "✓ $APP_DIR" || echo "✗ Not found")
- Web Root: $([[ -d "$WEB_ROOT" ]] && echo "✓ $WEB_ROOT" || echo "✗ Not found")
- Nginx Config: $([[ -d "/etc/nginx" ]] && echo "✓ /etc/nginx" || echo "✗ Not found")
- PM2 Processes: $(command -v pm2 &> /dev/null && echo "✓ PM2 dump" || echo "✗ PM2 not installed")
- Database: $(systemctl is-active --quiet postgresql && echo "✓ PostgreSQL dump" || echo "✗ PostgreSQL not running")

To restore from this backup, see restore-instructions.txt
EOF

# Create restore instructions
cat > "$BACKUP_DIR/restore-instructions.txt" << EOF
Restore Instructions for Career Portal
======================================

To restore from this backup:

1. Stop current services:
   sudo systemctl stop nginx
   pm2 stop all (if using PM2)

2. Restore application files:
   sudo rm -rf $APP_DIR
   sudo cp -r $BACKUP_DIR/career-portal-app $APP_DIR

3. Restore web root:
   sudo rm -rf $WEB_ROOT
   sudo cp -r $BACKUP_DIR/web-root $WEB_ROOT

4. Restore nginx configuration:
   sudo rm -rf /etc/nginx
   sudo cp -r $BACKUP_DIR/nginx-config /etc/nginx

5. Restore database (if needed):
   sudo -u postgres psql -c "DROP DATABASE IF EXISTS career_portal;"
   sudo -u postgres psql < $BACKUP_DIR/postgresql-backup.sql

6. Restore PM2 processes:
   pm2 delete all
   pm2 resurrect $BACKUP_DIR/pm2-processes.json

7. Restart services:
   sudo systemctl start nginx
   pm2 start all

EOF

echo ""
echo "=== Backup Complete ==="
echo "✓ Backup stored at: $BACKUP_DIR"
echo "✓ Backup size: $(sudo du -sh $BACKUP_DIR | cut -f1)"
echo ""
echo "Files backed up:"
ls -la "$BACKUP_DIR"
echo ""
echo "Ready for deployment!"