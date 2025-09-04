#!/bin/bash

# Deployment script for Ubuntu server 64.225.6.33
# Run this script AFTER running backup-server.sh

set -e  # Exit on any error

echo "=== Career Portal Deployment Script ==="
echo "Server: 64.225.6.33 (Ubuntu)"
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

echo ""
echo "Step 2: Installing system dependencies..."
# Update system packages
sudo apt update
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib curl git

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✓ PM2 installed"
fi

echo ""
echo "Step 3: Setting up application directory..."
# Create application directory
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
cd $APP_DIR

# Copy application files (assuming they're uploaded to /tmp/career-portal)
if [ -d "/tmp/career-portal" ]; then
    echo "Copying application files from /tmp/career-portal..."
    cp -r /tmp/career-portal/* .
else
    echo "⚠️  Application files not found in /tmp/career-portal"
    echo "Please upload the application files first, then re-run this script"
    exit 1
fi

echo ""
echo "Step 4: Installing Node.js dependencies..."
# Install dependencies
npm install --production

echo ""
echo "Step 5: Setting up environment variables..."
# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET=$(openssl rand -base64 32)

# Database Configuration
DATABASE_URL=postgresql://career_portal:career_portal_password@localhost:5432/career_portal
PGHOST=localhost
PGPORT=5432
PGUSER=career_portal
PGPASSWORD=career_portal_password
PGDATABASE=career_portal

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Application Settings
REPLIT_DOMAIN=64.225.6.33
REPL_ID=career-portal-production
EOF

echo "✓ Environment file created"

echo ""
echo "Step 6: Setting up PostgreSQL database..."
# Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE USER career_portal WITH PASSWORD 'career_portal_password';
CREATE DATABASE career_portal OWNER career_portal;
GRANT ALL PRIVILEGES ON DATABASE career_portal TO career_portal;
\q
EOF

# Run database migrations
export DATABASE_URL="postgresql://career_portal:career_portal_password@localhost:5432/career_portal"
npm run db:push

echo "✓ Database setup complete"

echo ""
echo "Step 7: Setting up nginx configuration..."
# Setup nginx
sudo tee $NGINX_SITE > /dev/null << 'EOF'
server {
    listen 80;
    server_name 64.225.6.33;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Main application
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (if serving directly)
    location /uploads/ {
        alias /var/www/career-portal/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf $NGINX_SITE /etc/nginx/sites-enabled/
sudo nginx -t
echo "✓ Nginx configuration complete"

echo ""
echo "Step 8: Setting up PM2 process management..."
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'career-portal',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✓ PM2 setup complete"

echo ""
echo "Step 9: Starting services..."
# Start services
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo ""
echo "Step 10: Setting up firewall..."
# Setup UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "=== Deployment Complete ==="
echo "✅ Career Portal deployed successfully!"
echo ""
echo "Application Details:"
echo "- URL: http://64.225.6.33"
echo "- App Directory: $APP_DIR"
echo "- Logs: $APP_DIR/logs/"
echo "- Database: PostgreSQL on localhost:5432"
echo ""
echo "Useful Commands:"
echo "- Check app status: pm2 status"
echo "- View logs: pm2 logs career-portal"
echo "- Restart app: pm2 restart career-portal"
echo "- Check nginx: sudo systemctl status nginx"
echo "- View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Test your deployment:"
echo "curl http://64.225.6.33"
echo ""