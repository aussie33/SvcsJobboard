#!/bin/bash

# Career Portal - Update Production from Replit
# Usage: ./update-from-replit.sh [server_ip]

SERVER_IP=${1:-"64.225.6.33"}

echo "🔄 Updating production server from Replit..."

# Step 1: Build the application locally in Replit
echo "🏗️ Building application..."
npm run build

# Step 2: Create update package (exclude heavy files)
echo "📦 Creating update package..."
tar -czf update-package.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=uploads \
    --exclude=.npm \
    --exclude=logs \
    --exclude=dist/dist \
    client/ server/ shared/ \
    package.json package-lock.json \
    vite.config.ts tsconfig.json tailwind.config.ts \
    migrate.js \
    dist/

# Step 3: Upload to server
echo "📤 Uploading to server..."
scp update-package.tar.gz root@$SERVER_IP:/tmp/

# Step 4: Apply updates on server
echo "⚙️ Applying updates on server..."
ssh root@$SERVER_IP << 'ENDSSH'

cd /var/www/career-portal

# Backup current version
tar -czf /var/backups/career-portal/pre-update-$(date +%Y%m%d_%H%M%S).tar.gz . --exclude=node_modules

# Extract updates
tar -xzf /tmp/update-package.tar.gz

# Install any new dependencies
npm install

# Rebuild if needed
npm run build

# Recreate proper directory structure
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/ 2>/dev/null || true

# Restart application
pm2 restart career-portal

# Clean up
rm /tmp/update-package.tar.gz

ENDSSH

# Clean up local package
rm update-package.tar.gz

# Verify deployment
echo "🔍 Verifying deployment..."
sleep 3
ssh root@$SERVER_IP 'pm2 status && curl -I http://localhost:5000'

echo "✅ Update complete!"
echo "🌐 Check your site at: http://$SERVER_IP"