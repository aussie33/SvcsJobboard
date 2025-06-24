#!/bin/bash

# Deploy to DigitalOcean without requiring local Docker
# This script builds the Docker image directly on the server

set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"

echo "Deploying to DigitalOcean without local Docker..."

# Create deployment package without Docker image
tar -czf deploy-package.tar.gz \
    server/ \
    shared/ \
    client/ \
    public/ \
    package*.json \
    tsconfig.json \
    tailwind.config.ts \
    postcss.config.js \
    vite.config.ts \
    Dockerfile.production \
    docker-compose.yml \
    init-db.sql \
    nginx.conf \
    production-server.js

echo "Uploading files to server..."
scp deploy-package.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "Building and deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    set -e
    cd /tmp
    
    # Extract files
    tar -xzf deploy-package.tar.gz
    
    # Create app directory
    mkdir -p /opt/career-portal-current
    cd /opt/career-portal-current
    
    # Move files to app directory
    mv /tmp/server ./
    mv /tmp/shared ./
    mv /tmp/client ./
    mv /tmp/public ./
    mv /tmp/package*.json ./
    mv /tmp/tsconfig.json ./
    mv /tmp/tailwind.config.ts ./
    mv /tmp/postcss.config.js ./
    mv /tmp/vite.config.ts ./
    mv /tmp/Dockerfile.production ./
    mv /tmp/docker-compose.yml ./
    mv /tmp/init-db.sql ./
    mv /tmp/nginx.conf ./
    mv /tmp/production-server.js ./
    
    # Create uploads directory
    mkdir -p uploads
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    # Install Docker Compose if needed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Build Docker image on server
    echo "Building Docker image..."
    docker build -f Dockerfile.production -t career-portal:current .
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start services
    echo "Starting services..."
    POSTGRES_PASSWORD="career_secure_password_2024" \
    SESSION_SECRET="career-portal-super-secret-key-production-2024" \
    docker-compose up -d
    
    # Wait for services to start
    echo "Waiting for services to start..."
    sleep 30
    
    # Check status
    echo "Checking service status..."
    docker-compose ps
    
    # Show logs
    echo "Recent application logs:"
    docker-compose logs --tail=10 app
    
    # Test health endpoint
    echo "Testing health endpoint..."
    sleep 10
    curl -f http://localhost/api/health || echo "Health check will be available shortly"
    
    # Cleanup
    rm -f /tmp/deploy-package.tar.gz get-docker.sh
    
    echo "✅ Deployment completed successfully!"
    echo "🌐 Career Portal is available at: http://64.225.6.33"
    echo "📋 Login credentials:"
    echo "   Admin: admin / admin123"
    echo "   Employee: employee / employee123"
    echo "   Applicant: applicant / applicant123"
EOF

# Cleanup local files
rm -f deploy-package.tar.gz

echo ""
echo "🎉 Deployment completed!"
echo "Access your Career Portal at: http://64.225.6.33"
echo ""
echo "To check status later, run:"
echo "ssh $SERVER_USER@$SERVER_IP 'cd /opt/career-portal-current && docker-compose ps'"