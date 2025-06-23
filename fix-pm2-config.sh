#!/bin/bash

# Fix PM2 configuration for ES modules
# Run this on your server at 162.243.190.66

cd /var/www/career-portal

# Stop any existing processes
pm2 delete career-portal 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true

# Create PM2 config as .cjs (CommonJS) instead of .js
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'career-portal',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      SESSION_SECRET: 'career-portal-secret-2024'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Remove old config file
rm -f ecosystem.config.js

# Ensure logs directory exists
mkdir -p logs

# Start with the .cjs config
pm2 start ecosystem.config.cjs
pm2 save

# Check status
pm2 status

# Test health endpoint
sleep 3
curl -s http://localhost:5000/health

echo ""
echo "PM2 configuration fixed for ES modules!"
echo "Check status: pm2 status"
echo "View logs: pm2 logs career-portal"