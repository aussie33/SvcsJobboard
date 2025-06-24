#!/bin/bash

# Quick Docker deployment script for DigitalOcean
# This script builds and deploys the Career Portal directly to your server

set -e

# Configuration
SERVER_IP="64.225.6.33"
SERVER_USER="root"
APP_NAME="career-portal"

echo "Building and deploying Career Portal to DigitalOcean..."

# Build the Docker image
echo "Building Docker image..."
docker build -f Dockerfile.production -t ${APP_NAME}:latest .

# Save and compress the image
echo "Saving Docker image..."
docker save ${APP_NAME}:latest | gzip > ${APP_NAME}-image.tar.gz

# Create deployment package
echo "Creating deployment package..."
tar -czf career-portal-docker-deploy.tar.gz \
    ${APP_NAME}-image.tar.gz \
    docker-compose.production.yml \
    init-db.sql \
    nginx.conf

# Deploy to server
echo "Deploying to server..."
scp career-portal-docker-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
    cd /tmp
    
    # Extract deployment package
    tar -xzf career-portal-docker-deploy.tar.gz
    
    # Create app directory
    mkdir -p /opt/career-portal
    cd /opt/career-portal
    mv /tmp/docker-compose.production.yml ./docker-compose.yml
    mv /tmp/init-db.sql ./
    mv /tmp/nginx.conf ./
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    # Install Docker Compose if needed
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Load Docker image
    gunzip -c /tmp/career-portal-image.tar.gz | docker load
    
    # Stop existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Set environment variables
    export POSTGRES_PASSWORD="career_secure_password_2024"
    export SESSION_SECRET="career-portal-super-secret-key-production-2024"
    
    # Start services
    docker-compose up -d
    
    # Wait for services
    sleep 30
    
    # Check status
    docker-compose ps
    
    # Show recent logs
    echo "Recent logs:"
    docker-compose logs --tail=20 app
    
    # Cleanup
    rm -f /tmp/career-portal-*
    rm -f get-docker.sh
    
    echo "Deployment completed!"
    echo "Career Portal available at: http://64.225.6.33"
EOF

# Cleanup local files
rm -f ${APP_NAME}-image.tar.gz career-portal-docker-deploy.tar.gz

echo "Deployment process completed!"
echo "Access your Career Portal at: http://64.225.6.33"