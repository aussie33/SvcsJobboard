#!/bin/bash

echo "🐳 Starting Docker deployment for Career Portal..."

cd /var/www/career-portal || exit 1

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    apt update
    apt install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    usermod -aG docker $USER
fi

# Create optimized Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY public ./public
COPY dist ./dist
COPY *.ts *.js *.json ./

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/index.js"]
EOF

# Create docker-compose with health checks
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  career-portal:
    build: .
    ports:
      - "80:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - career-portal
    restart: unless-stopped
EOF

# Create Nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream app {
        server career-portal:5000;
    }

    server {
        listen 80;
        server_name 64.225.6.33;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Test the deployment
echo "🧪 Testing deployment..."
sleep 5

# Test health endpoint
if curl -f http://localhost/health &>/dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    echo "📋 Container logs:"
    docker-compose logs career-portal --tail 20
fi

# Test basic connectivity
if curl -I http://localhost &>/dev/null; then
    echo "✅ Web server responding"
else
    echo "❌ Web server not responding"
fi

echo ""
echo "🎉 Docker deployment complete!"
echo "📋 Access your Career Portal at: http://64.225.6.33"
echo ""
echo "🔧 Management commands:"
echo "• View logs: docker-compose logs -f career-portal"
echo "• Restart: docker-compose restart"
echo "• Stop: docker-compose down"
echo "• Update: docker-compose build --no-cache && docker-compose up -d"
echo ""
echo "📊 Check status: docker-compose ps"