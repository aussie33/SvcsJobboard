#!/bin/bash

# Career Portal - Multi-Environment Setup
# Usage: ./setup-environments.sh [server_ip] [environment]

SERVER_IP=$1
ENVIRONMENT=${2:-"staging"}

if [ -z "$SERVER_IP" ]; then
    echo "Usage: $0 <server_ip> [environment]"
    echo "Environments: dev, staging, prod"
    echo "Example: $0 64.225.6.33 staging"
    exit 1
fi

echo "Setting up $ENVIRONMENT environment on $SERVER_IP..."

# Define ports for different environments
case $ENVIRONMENT in
    "dev")
        PORT=5001
        NGINX_PORT=81
        ;;
    "staging") 
        PORT=5002
        NGINX_PORT=82
        ;;
    "prod")
        PORT=5000
        NGINX_PORT=80
        ;;
    *)
        echo "Invalid environment. Use: dev, staging, or prod"
        exit 1
        ;;
esac

# Create deployment package
echo "Creating deployment package..."
tar -czf career-portal-${ENVIRONMENT}.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=uploads \
    --exclude=dist \
    --exclude=.npm \
    --exclude=logs \
    .

# Copy to server
scp career-portal-${ENVIRONMENT}.tar.gz root@$SERVER_IP:/tmp/

# Setup environment on server
ssh root@$SERVER_IP << ENDSSH

# Create environment directory
mkdir -p /var/www/career-portal-${ENVIRONMENT}
cd /var/www/career-portal-${ENVIRONMENT}

# Extract application
tar -xzf /tmp/career-portal-${ENVIRONMENT}.tar.gz

# Install dependencies
npm install

# Build application
npm run build

# Create proper directory structure
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Set permissions
chown -R www-data:www-data .

# Create environment-specific config
cat > .env << EOF
NODE_ENV=${ENVIRONMENT}
PORT=${PORT}
DATABASE_URL=\${DATABASE_URL_${ENVIRONMENT^^}}
SESSION_SECRET=\${SESSION_SECRET_${ENVIRONMENT^^}}
EOF

# Create Nginx configuration for this environment
cat > /etc/nginx/sites-available/career-portal-${ENVIRONMENT} << EOF
server {
    listen ${NGINX_PORT};
    server_name _;

    # Add environment header
    add_header X-Environment "${ENVIRONMENT}" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    # Upload files
    location /uploads/ {
        proxy_pass http://localhost:${PORT};
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }

    # All other routes
    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
        proxy_cache_bypass \\\$http_upgrade;
    }

    client_max_body_size 10M;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/career-portal-${ENVIRONMENT} /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t && systemctl reload nginx

# Start application with PM2
PORT=${PORT} pm2 start "node dist/index.js" --name "career-portal-${ENVIRONMENT}"

# Cleanup
rm /tmp/career-portal-${ENVIRONMENT}.tar.gz

ENDSSH

# Cleanup local package
rm career-portal-${ENVIRONMENT}.tar.gz

echo "Environment setup complete!"
echo "Access ${ENVIRONMENT} at: http://$SERVER_IP:$NGINX_PORT"
echo "Monitor with: ssh root@$SERVER_IP 'pm2 status'"