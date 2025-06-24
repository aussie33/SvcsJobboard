#!/bin/bash

echo "Fixing frontend connection issues..."

cd /var/www/career-portal

# Test both ports to see which is working
echo "=== Testing Port 80 ==="
curl -I http://64.225.6.33/ 2>/dev/null && echo "Port 80: Working" || echo "Port 80: Not working"

echo ""
echo "=== Testing Port 8080 ==="
curl -I http://64.225.6.33:8080/ 2>/dev/null && echo "Port 8080: Working" || echo "Port 8080: Not working"

# Test the exact login flow from browser perspective
echo ""
echo "=== Testing Full Login Flow ==="
# First get a session
curl -c /tmp/session.txt -s http://localhost:8080/ > /dev/null

# Then try login with that session
LOGIN_RESULT=$(curl -b /tmp/session.txt -c /tmp/session.txt \
  -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -s)

echo "Login result: $LOGIN_RESULT"

# Test if session persists
AUTH_RESULT=$(curl -b /tmp/session.txt \
  -X GET http://localhost:8080/api/auth/me \
  -s)

echo "Auth check: $AUTH_RESULT"

rm -f /tmp/session.txt

# Also restart container to ensure fresh state
echo ""
echo "=== Restarting container for fresh state ==="
docker restart career-portal
sleep 10

# Make sure firewall allows both ports
ufw status | grep 8080 || ufw allow 8080

echo ""
echo "=== Container restarted, testing again ==="
curl -I http://localhost:8080/health

echo ""
echo "=== Access Information ==="
echo "Primary URL: http://64.225.6.33:8080"
echo "Backup URL: http://64.225.6.33"
echo "Login: admin / admin123"
echo ""
echo "If you still get 'Load failed':"
echo "1. Try http://64.225.6.33:8080 directly"
echo "2. Clear your browser cache/cookies"
echo "3. Try in an incognito/private browser window"
echo "4. Check if your firewall/network blocks port 8080"