#!/bin/bash

# Upload script to transfer files to 134.199.237.34
# Run this script from your local machine or Replit environment

set -e

echo "=== Career Portal Upload Script ==="
echo "Target: 134.199.237.34"
echo "Date: $(date)"
echo ""

# Configuration
SERVER="134.199.237.34"
SERVER_USER="root"  # Change this to your actual username
TEMP_DIR="/tmp/career-portal"

# Check if we have the necessary files
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not found. Run 'npm run build' first."
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

echo "Step 1: Preparing files for upload..."

# Create a temporary directory with all necessary files
mkdir -p upload-package
rm -rf upload-package/*

# Copy essential files
cp -r dist/* upload-package/
cp package.json upload-package/
cp package-lock.json upload-package/ 2>/dev/null || echo "No package-lock.json found"
cp -r server upload-package/ 2>/dev/null || echo "Server directory copied from dist"
cp -r shared upload-package/ 2>/dev/null || echo "Shared directory copied"
cp -r public upload-package/ 2>/dev/null || echo "Public directory copied"
cp drizzle.config.ts upload-package/ 2>/dev/null || echo "No drizzle.config.ts found"

# Copy database schema if it exists
if [ -f "shared/schema.ts" ]; then
    mkdir -p upload-package/shared
    cp shared/schema.ts upload-package/shared/
fi

# Copy environment template
cat > upload-package/.env.template << 'EOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET=CHANGE_ME_TO_RANDOM_STRING

# Database Configuration
DATABASE_URL=postgresql://career_portal_user:career_portal_secure_pass@localhost:5432/career_portal_db
PGHOST=localhost
PGPORT=5432
PGUSER=career_portal_user
PGPASSWORD=career_portal_secure_pass
PGDATABASE=career_portal_db

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Application Settings
REPLIT_DOMAIN=134.199.237.34
REPL_ID=career-portal-production
EOF

echo "✓ Files prepared for upload"

echo ""
echo "Step 2: Uploading files to server..."

# Check if we can connect to the server
if ! ping -c 1 $SERVER &> /dev/null; then
    echo "❌ Cannot reach server $SERVER. Check your connection."
    exit 1
fi

# Upload files using rsync (more reliable than scp for directories)
echo "Uploading files via rsync..."
rsync -avz --progress upload-package/ $SERVER_USER@$SERVER:$TEMP_DIR/

echo "✓ Files uploaded successfully"

echo ""
echo "Step 3: Setting permissions on server..."

# Set correct permissions
ssh $SERVER_USER@$SERVER << 'EOF'
chmod +x /tmp/career-portal/*.sh 2>/dev/null || true
chown -R www-data:www-data /tmp/career-portal 2>/dev/null || true
EOF

echo "✓ Permissions set"

# Clean up local temporary files
rm -rf upload-package

echo ""
echo "=== Upload Complete ==="
echo "✅ Application files uploaded to $SERVER:$TEMP_DIR"
echo ""
echo "Next steps on server $SERVER:"
echo "1. ssh $SERVER_USER@$SERVER"
echo "2. cd $TEMP_DIR"
echo "3. chmod +x *.sh"
echo "4. ./backup-new-server.sh    # Backup current installation"
echo "5. ./deploy-to-new-server.sh # Deploy new version"
echo ""
echo "Files uploaded:"
ssh $SERVER_USER@$SERVER "ls -la $TEMP_DIR" 2>/dev/null || echo "Cannot list remote files"