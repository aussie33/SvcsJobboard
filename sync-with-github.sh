#!/bin/bash

# Career Portal - GitHub Sync and Deploy
# Usage: ./sync-with-github.sh [server_ip] [github_repo_url]

SERVER_IP=${1:-"64.225.6.33"}
GITHUB_REPO=$2

if [ -z "$GITHUB_REPO" ]; then
    echo "Usage: $0 [server_ip] <github_repo_url>"
    echo "Example: $0 64.225.6.33 https://github.com/yourusername/career-portal.git"
    exit 1
fi

echo "🔄 Syncing with GitHub and deploying..."

# Step 1: Push changes to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Update from Replit - $(date)"
git push origin main

# Step 2: Deploy from GitHub to server
echo "🚀 Deploying from GitHub to server..."
ssh root@$SERVER_IP << ENDSSH

cd /var/www

# Backup current installation
if [ -d "career-portal" ]; then
    mv career-portal career-portal-backup-$(date +%Y%m%d_%H%M%S)
fi

# Clone fresh from GitHub
git clone $GITHUB_REPO career-portal
cd career-portal

# Install dependencies
npm install

# Build application
npm run build

# Create proper directory structure
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/

# Set proper permissions
chown -R www-data:www-data .
chmod -R 755 .

# Create uploads directory
mkdir -p uploads
chown -R www-data:www-data uploads/

# Restart application
pm2 restart career-portal || pm2 start "node dist/index.js" --name "career-portal"

ENDSSH

echo "✅ GitHub sync and deployment complete!"
echo "🌐 Site updated at: http://$SERVER_IP"