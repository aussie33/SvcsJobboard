#!/bin/bash

# Deployment script for Ubuntu server 134.199.237.34
# Run this script AFTER running backup-new-server.sh

set -e  # Exit on any error

echo "=== Career Portal Deployment Script ==="
echo "Server: 134.199.237.34 (Ubuntu)"
echo "Date: $(date)"
echo ""

# Configuration
APP_DIR="/var/www/career-portal"
WEB_ROOT="/var/www/html"
NGINX_SITE="/etc/nginx/sites-available/career-portal"
SERVICE_NAME="career-portal"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo "⚠️  Running as root. This script should be run as a regular user with sudo privileges."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Step 1: Stopping existing services..."
# Stop existing services
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"
sudo systemctl stop $SERVICE_NAME 2>/dev/null || echo "Career portal service not running"
pm2 stop all 2>/dev/null || echo "No PM2 processes running"
sudo pkill -f "node.*career" 2>/dev/null || echo "No node processes found"

# Step 2: Copy to new server
echo "📤 Copying files to new server..."
scp career-portal-deploy.tar.gz root@$NEW_SERVER_IP:/tmp/
scp deploy-to-new-server.sh root@$NEW_SERVER_IP:/tmp/

# Step 3: Setup on new server
echo "⚙️ Setting up on new server..."
ssh root@$NEW_SERVER_IP << 'ENDSSH'

# Install dependencies
apt update
apt install -y nodejs npm nginx postgresql-client

# Install PM2 globally
npm install -g pm2

# Create application directory
mkdir -p /var/www/career-portal
cd /var/www/career-portal

# Extract application
tar -xzf /tmp/career-portal-deploy.tar.gz

# Install dependencies
npm install

# Build application
npm run build

# Create proper directory structure for static files
mkdir -p /var/www/career-portal/dist/public
cp -r /var/www/career-portal/dist/dist/client/* /var/www/career-portal/dist/public/

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

ENDSSH

# Step 4: Configure environment and database
echo "🗄️ Configuring database and environment..."
ssh root@$NEW_SERVER_IP << ENDSSH

cd /var/www/career-portal

# Set database URL
export DATABASE_URL="$NEW_DATABASE_URL"
echo "DATABASE_URL=$NEW_DATABASE_URL" > .env

# Run database migration
node migrate.js

ENDSSH

# Step 5: Configure Nginx
echo "🌐 Configuring Nginx..."
ssh root@$NEW_SERVER_IP << 'ENDSSH'

# Create Nginx configuration
cat > /etc/nginx/sites-available/career-portal << 'EOF'
server {
    listen 80;
    server_name _;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Upload files
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other routes - serve React app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/career-portal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx
systemctl enable nginx

ENDSSH

# Step 6: Start application
echo "🚀 Starting Career Portal..."
ssh root@$NEW_SERVER_IP << 'ENDSSH'

cd /var/www/career-portal

# Start with PM2
DATABASE_URL="$NEW_DATABASE_URL" pm2 start "node dist/index.js" --name "career-portal" --max-restarts 3

# Save PM2 configuration
pm2 save
pm2 startup

ENDSSH

# Step 7: Copy uploads (if any exist)
echo "📁 Copying uploaded files..."
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
    scp -r uploads/* root@$NEW_SERVER_IP:/var/www/career-portal/uploads/
fi

# Cleanup
rm career-portal-deploy.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Your Career Portal is now available at: http://$NEW_SERVER_IP"
echo "📊 Monitor with: ssh root@$NEW_SERVER_IP 'pm2 status'"
echo "📋 View logs with: ssh root@$NEW_SERVER_IP 'pm2 logs career-portal'"