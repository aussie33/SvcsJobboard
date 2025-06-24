#!/bin/bash

echo "Debugging Docker deployment issues..."

cd /var/www/career-portal

# Check container status
echo "=== Container Status ==="
docker-compose ps

echo ""
echo "=== Container Logs ==="
docker-compose logs career-portal --tail 20

echo ""
echo "=== Stop and recreate containers ==="
docker-compose down
docker-compose up -d

sleep 10

echo ""
echo "=== Testing direct container access ==="
curl -I http://localhost:5000/health 2>/dev/null || echo "Container not responding"

echo ""
echo "=== Check if containers are running ==="
docker ps

# If containers aren't working, use simple single container approach
if ! docker ps | grep -q career-portal; then
    echo ""
    echo "=== Deploying simplified single container ==="
    
    # Create simplified Dockerfile
    cat > Dockerfile.simple << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Build if needed
RUN npm run build 2>/dev/null || echo "Build not needed"

EXPOSE 5000

CMD ["node", "server/final-auth-fix.js"]
EOF

    # Build and run simple container
    docker stop career-portal 2>/dev/null || true
    docker rm career-portal 2>/dev/null || true
    
    docker build -f Dockerfile.simple -t career-portal-simple .
    docker run -d --name career-portal -p 80:5000 career-portal-simple
    
    sleep 5
    
    echo "=== Testing simple container ==="
    curl -I http://localhost/health || echo "Simple container failed"
fi

echo ""
echo "=== Final status check ==="
docker ps
curl -I http://localhost/ 2>/dev/null && echo "✅ Server responding" || echo "❌ Server not responding"