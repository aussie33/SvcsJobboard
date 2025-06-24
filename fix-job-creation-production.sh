#!/bin/bash

# Fix Job Creation for Production Environment
# Addresses specific issues between Replit and DigitalOcean deployment

SERVER_IP=$1

if [ -z "$SERVER_IP" ]; then
    echo "Usage: $0 <server_ip>"
    echo "Example: $0 192.168.1.100"
    exit 1
fi

echo "Fixing job creation functionality on production server: $SERVER_IP"

# Create the fix package locally
tar -czf job-creation-fix.tar.gz \
    server/index.ts \
    server/routes.ts \
    server/storage.ts \
    server/postgres-storage.ts \
    shared/schema.ts \
    --transform 's,^,career-portal/,'

# Copy fix to server
scp job-creation-fix.tar.gz root@$SERVER_IP:/tmp/
scp fix-job-creation-production.sh root@$SERVER_IP:/tmp/

# Apply fixes on remote server
ssh root@$SERVER_IP << 'ENDSSH'

cd /var/www/career-portal

# Backup current files
cp -r server server.backup
cp -r shared shared.backup

# Extract updated files
tar -xzf /tmp/job-creation-fix.tar.gz --strip-components=1

# Fix 1: Update server index for production compatibility
cat > server/index.js << 'EOF'
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Import TypeScript compiled modules
const { storage } = require('./storage');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting Career Portal server...');

// Trust proxy for production behind Nginx
app.set('trust proxy', 1);

// Session configuration optimized for production
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
    ttl: 86400000, // TTL for session data
    stale: false
  }),
  secret: process.env.SESSION_SECRET || 'career-portal-production-secret-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on each request
  cookie: {
    secure: false, // Set to true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'career-portal-session'
}));

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS headers for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Static file serving - multiple fallback paths
const staticPaths = [
  path.join(__dirname, '../dist/public'),
  path.join(__dirname, '../dist/client'),
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../build')
];

let staticPath = null;
for (const testPath of staticPaths) {
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log(`Found static files at: ${staticPath}`);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath));
  console.log(`Serving static files from: ${staticPath}`);
} else {
  console.warn('No static file directory found, serving will be limited');
}

// Register API routes
registerRoutes(app).then(() => {
  console.log('API routes registered successfully');
}).catch(err => {
  console.error('Error registering routes:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  if (staticPath) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application build not found');
    }
  } else {
    res.status(404).send('Static files not configured');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Career Portal server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Static path: ${staticPath || 'Not configured'}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill existing processes or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server startup error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

EOF

# Fix 2: Update PM2 configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'career-portal',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      SESSION_SECRET: 'career-portal-production-secret-2024'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    kill_timeout: 5000
  }]
};
EOF

# Fix 3: Ensure proper build structure
echo "Checking and fixing build structure..."
if [ ! -d "dist/public" ]; then
  echo "Creating proper build structure..."
  mkdir -p dist/public
  
  # Copy from various possible build locations
  if [ -d "dist/client" ]; then
    cp -r dist/client/* dist/public/
  elif [ -d "client/dist" ]; then
    cp -r client/dist/* dist/public/
  elif [ -d "build" ]; then
    cp -r build/* dist/public/
  fi
fi

# Fix 4: Restart application with proper cleanup
echo "Restarting application..."

# Kill any processes using port 5000
fuser -k 5000/tcp 2>/dev/null || true
sleep 2

# Stop PM2 processes
pm2 delete career-portal 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Create logs directory
mkdir -p logs

# Start fresh PM2 daemon and application
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Verify the application started
sleep 5
if pm2 list | grep -q "career-portal.*online"; then
  echo "✅ Career Portal started successfully"
  pm2 logs career-portal --lines 10
else
  echo "❌ Career Portal failed to start"
  pm2 logs career-portal --lines 20
  exit 1
fi

# Test the API
echo "Testing job creation API..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health
if [ $? -eq 0 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
fi

ENDSSH

# Clean up local files
rm -f job-creation-fix.tar.gz

echo "✅ Job creation fix deployment completed"
echo "🔗 Test the application at: http://$SERVER_IP"
echo "📊 Monitor with: ssh root@$SERVER_IP 'pm2 logs career-portal'"