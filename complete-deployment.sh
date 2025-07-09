#!/bin/bash

# Complete Docker Deployment Script for Replit Environment
# Run this on your server: bash complete-deployment.sh

echo "🚀 Starting Docker deployment of Career Portal with Replit Environment"

# Step 1: Stop existing services
echo "=== Step 1: Stopping existing services ==="
systemctl stop career-portal-production 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
docker-compose -f docker-compose.replit-env.yml down 2>/dev/null || true
echo "✅ Services stopped"

# Step 2: Install Docker and Docker Compose if needed
echo "=== Step 2: Checking Docker installation ==="
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Step 3: Build containers
echo "=== Step 3: Building Docker containers ==="
docker-compose -f docker-compose.replit-env.yml build --no-cache
if [ $? -eq 0 ]; then
    echo "✅ Containers built successfully"
else
    echo "❌ Container build failed"
    exit 1
fi

# Step 4: Start services
echo "=== Step 4: Starting services ==="
docker-compose -f docker-compose.replit-env.yml up -d
if [ $? -eq 0 ]; then
    echo "✅ Services started successfully"
else
    echo "❌ Service start failed"
    exit 1
fi

# Step 5: Wait for services to be ready
echo "=== Step 5: Waiting for services to be ready ==="
sleep 30

# Step 6: Check status
echo "=== Step 6: Checking service status ==="
docker-compose -f docker-compose.replit-env.yml ps

# Step 7: Test if application is responding
echo "=== Step 7: Testing application ==="
if curl -f -s http://localhost:80 > /dev/null; then
    echo "✅ Application is responding"
else
    echo "⚠️  Application may still be starting, checking logs..."
    docker-compose -f docker-compose.replit-env.yml logs --tail=20
fi

echo ""
echo "🎉 Deployment completed!"
echo "Your Career Portal should be accessible at: http://64.225.6.33"
echo ""
echo "To check logs: docker-compose -f docker-compose.replit-env.yml logs -f"
echo "To stop: docker-compose -f docker-compose.replit-env.yml down"
echo "To restart: docker-compose -f docker-compose.replit-env.yml restart"