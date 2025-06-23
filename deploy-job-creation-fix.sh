#!/bin/bash

# Simple fix for job creation on DigitalOcean
# Usage: ./deploy-job-creation-fix.sh <server_ip>

SERVER_IP=$1

if [ -z "$SERVER_IP" ]; then
    echo "Usage: $0 <server_ip>"
    exit 1
fi

echo "Deploying job creation fix to $SERVER_IP..."

# Upload the fix script
scp deploy-job-creation-fix.sh root@$SERVER_IP:/tmp/

ssh root@$SERVER_IP << 'ENDSSH'
cd /var/www/career-portal

# Stop current process
pm2 delete career-portal 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true

# Update server index.js for production compatibility
cat > server/index.js << 'EOF'
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Import modules
const { storage } = require('./storage');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Session configuration
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  secret: 'career-portal-secret-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../dist/public')));

// Register routes
registerRoutes(app).then(() => {
  console.log('Routes registered');
}).catch(console.error);

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build not found');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create PM2 config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'career-portal',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Ensure build directory exists
mkdir -p dist/public
if [ -d "dist/client" ]; then
  cp -r dist/client/* dist/public/
fi

# Start application
pm2 start ecosystem.config.js
pm2 save

echo "Job creation fix deployed successfully"
pm2 status

ENDSSH

echo "Deployment complete. Test at http://$SERVER_IP"