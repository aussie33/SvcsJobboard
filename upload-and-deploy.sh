#!/bin/bash

# Upload and deploy script for Career Portal
echo "🚀 Uploading and deploying Career Portal to server..."

# Upload the fixed deployment package
echo "📦 Uploading deployment package..."
scp -o StrictHostKeyChecking=no career-portal-fixed.tar.gz root@64.225.6.33:/root/

# Connect to server and deploy
echo "🔧 Connecting to server and deploying..."
ssh -o StrictHostKeyChecking=no root@64.225.6.33 << 'EOF'
cd /root

# Stop existing services
echo "⏹️  Stopping existing services..."
systemctl stop career-portal-production 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
docker-compose down 2>/dev/null || true

# Extract the new deployment package
echo "📂 Extracting deployment package..."
tar -xzf career-portal-fixed.tar.gz

# Build and start with the fixed configuration
echo "🏗️  Building Docker containers..."
docker-compose -f docker-compose.fixed.yml build --no-cache

echo "🚀 Starting services..."
docker-compose -f docker-compose.fixed.yml up -d

echo "⏱️  Waiting for services to start..."
sleep 30

echo "📊 Checking service status..."
docker-compose -f docker-compose.fixed.yml ps

echo "🧪 Testing application..."
curl -I http://localhost:80

echo ""
echo "✅ Deployment completed!"
echo "🌐 Career Portal should be accessible at: http://64.225.6.33"
echo ""
echo "📋 Management commands:"
echo "  Check logs: docker-compose -f docker-compose.fixed.yml logs -f"
echo "  Stop: docker-compose -f docker-compose.fixed.yml down"
echo "  Restart: docker-compose -f docker-compose.fixed.yml restart"
EOF