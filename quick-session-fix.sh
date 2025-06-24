#!/bin/bash

# Quick session fix script to run on production server
# Copy this script content and run it directly on your server

echo "Applying session authentication fix..."

cd /var/www/career-portal

# Backup current server files
tar -czf /var/backups/career-portal/pre-session-fix-$(date +%Y%m%d_%H%M%S).tar.gz server/

# Fix the session configuration in server/index.ts
cat > temp-session-fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = 'server/index.ts';
let content = fs.readFileSync(serverIndexPath, 'utf8');

// Fix imports
content = content.replace(
  'import session from \'express-session\';',
  'import session from \'express-session\';\nimport MemoryStore from \'memorystore\';'
);

// Fix session configuration
const oldSessionConfig = `// Set up session middleware with proper production configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-secret-key-dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  name: 'connect.sid',
  proxy: process.env.NODE_ENV === 'production' // Trust proxy in production
}));`;

const newSessionConfig = `// Set up session middleware with proper production configuration
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-secret-key-dev',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false, // Keep false for HTTP in production
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'connect.sid'
}));`;

content = content.replace(oldSessionConfig, newSessionConfig);

fs.writeFileSync(serverIndexPath, content);
console.log('Session configuration updated');
EOF

# Run the fix
node temp-session-fix.js

# Rebuild the application
npm run build

# Create proper directory structure
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/

# Restart the application
pm2 restart career-portal

# Clean up
rm temp-session-fix.js

echo "Session authentication fix applied successfully!"
echo "Test by logging in at: http://$(hostname -I | awk '{print $1}')"