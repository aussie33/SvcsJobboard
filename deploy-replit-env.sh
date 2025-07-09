#!/bin/bash

# Deploy Career Portal with Replit Environment on VPS
# This script replicates Replit's environment exactly

echo "🚀 Deploying Career Portal with Replit Environment"

# Server configuration
SERVER_IP="64.225.6.33"
SERVER_USER="root"
SERVER_PASSWORD="lm48532"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf replit-env-deploy.tar.gz \
  client \
  server \
  shared \
  package.json \
  package-lock.json \
  tsconfig.json \
  vite.config.ts \
  tailwind.config.ts \
  postcss.config.js \
  drizzle.config.ts \
  theme.json \
  docker-compose.replit-env.yml \
  Dockerfile.replit-env \
  deploy-replit-env.sh

echo "✅ Package created: replit-env-deploy.tar.gz"

# Deploy to server
echo "🔄 Deploying to server..."
sshpass -p "$SERVER_PASSWORD" scp replit-env-deploy.tar.gz "$SERVER_USER@$SERVER_IP:/root/"

# Execute deployment on server
sshpass -p "$SERVER_PASSWORD" ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
cd /root

# Stop any existing services
docker-compose -f docker-compose.replit-env.yml down 2>/dev/null || true
systemctl stop career-portal-production 2>/dev/null || true

# Extract new deployment
tar -xzf replit-env-deploy.tar.gz
cd replit-env-deploy

# Install Docker and Docker Compose if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Build and start services
echo "🏗️  Building Career Portal with Replit environment..."
docker-compose -f docker-compose.replit-env.yml build --no-cache

echo "🚀 Starting services..."
docker-compose -f docker-compose.replit-env.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.replit-env.yml ps | grep -q "Up"; then
    echo "✅ Career Portal is running!"
    echo "🌐 Access your site at: http://64.225.6.33"
    echo ""
    echo "Services status:"
    docker-compose -f docker-compose.replit-env.yml ps
else
    echo "❌ Deployment failed. Checking logs..."
    docker-compose -f docker-compose.replit-env.yml logs
fi
EOF

echo "🎉 Deployment completed!"
echo "Your Career Portal should be accessible at: http://64.225.6.33"