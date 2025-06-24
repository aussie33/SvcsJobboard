#!/bin/bash

echo "Checking Docker container status and fixing login issues..."

cd /var/www/career-portal

# Check container status
echo "=== Container Status ==="
docker ps -a

# Check container logs
echo ""
echo "=== Container Logs (last 20 lines) ==="
docker logs career-portal --tail 20

# Test if container is responding
echo ""
echo "=== Testing Container Health ==="
curl -s http://localhost:8080/health | head -100

# Test login endpoint specifically
echo ""
echo "=== Testing Login Endpoint ==="
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v

# If container is not running properly, restart it
if ! docker ps | grep -q career-portal; then
    echo ""
    echo "=== Container not running, restarting ==="
    docker stop career-portal 2>/dev/null || true
    docker rm career-portal 2>/dev/null || true
    docker run -d --name career-portal -p 8080:5000 career-portal-simple
    sleep 5
    
    echo "=== Testing after restart ==="
    curl -I http://localhost:8080/health
fi

echo ""
echo "=== Final Status ==="
echo "Container running: $(docker ps | grep career-portal | wc -l)"
echo "Health check: $(curl -s http://localhost:8080/health | grep -o '"status":"ok"' || echo "failed")"
echo ""
echo "Access your portal at:"
echo "• http://64.225.6.33:8080"
echo "• Login: admin/admin123"