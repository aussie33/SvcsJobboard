#!/bin/bash

echo "Fixing port conflict and deploying on port 8080..."

cd /var/www/career-portal

# Stop existing Nginx that's using port 80
systemctl stop nginx
killall nginx 2>/dev/null || true

# Remove any existing containers
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Run simple container on port 8080 to avoid conflicts
docker run -d --name career-portal -p 8080:5000 career-portal-simple

# Wait for container to start
sleep 5

# Test the container
echo "Testing container on port 8080..."
curl -I http://localhost:8080/health || echo "Container not responding"

# Update firewall to allow port 8080
ufw allow 8080

# Also try direct port 80 binding if Nginx is stopped
docker stop career-portal 2>/dev/null
docker rm career-portal 2>/dev/null
docker run -d --name career-portal -p 80:5000 career-portal-simple

sleep 3

echo "Final test on port 80..."
curl -I http://localhost/health && echo "✅ Working on port 80" || echo "❌ Port 80 still blocked"

echo ""
echo "Testing alternative port 8080..."
docker stop career-portal 2>/dev/null
docker rm career-portal 2>/dev/null
docker run -d --name career-portal -p 8080:5000 career-portal-simple

sleep 3
curl -I http://localhost:8080/health && echo "✅ Working on port 8080" || echo "❌ Port 8080 failed"

echo ""
echo "Container status:"
docker ps

echo ""
echo "Try accessing:"
echo "• http://64.225.6.33 (if port 80 works)"
echo "• http://64.225.6.33:8080 (alternative port)"