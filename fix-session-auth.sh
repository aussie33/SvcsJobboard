#!/bin/bash

# Fix session authentication on production server
SERVER_IP="64.225.6.33"

echo "Fixing session authentication on production server..."

# Build the updated application
npm run build

# Create update package with the session fixes
tar -czf session-fix.tar.gz \
    server/index.ts \
    server/routes.ts \
    dist/

# Upload to server
scp session-fix.tar.gz root@$SERVER_IP:/tmp/

# Apply the fix on server
ssh root@$SERVER_IP << 'ENDSSH'

cd /var/www/career-portal

# Backup current version
tar -czf /var/backups/career-portal/pre-session-fix-$(date +%Y%m%d_%H%M%S).tar.gz server/ dist/

# Extract the session fix
tar -xzf /tmp/session-fix.tar.gz

# Rebuild the application
npm run build

# Create proper directory structure
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/

# Restart the application
pm2 restart career-portal

# Clean up
rm /tmp/session-fix.tar.gz

echo "Session fix applied successfully"

ENDSSH

# Clean up local package
rm session-fix.tar.gz

echo "Testing authentication..."
sleep 3

# Test the fix
curl -c cookies.txt -X POST http://$SERVER_IP/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'

echo ""
echo "Testing authenticated endpoint..."
curl -b cookies.txt http://$SERVER_IP/api/auth/me

echo ""
echo "Session authentication fix deployed successfully!"