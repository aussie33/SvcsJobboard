#!/bin/bash

# Complete Job Creation Fix for DigitalOcean
# Run this script directly on your server at 162.243.190.66

echo "Applying job creation fix for DigitalOcean environment..."

cd /var/www/career-portal

# Stop existing processes
echo "Stopping existing processes..."
pm2 delete career-portal 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
sleep 3

# Backup current configuration
echo "Backing up current files..."
cp server/index.js server/index.js.backup 2>/dev/null || true
cp ecosystem.config.js ecosystem.config.js.backup 2>/dev/null || true

# Update server/index.js for production compatibility
echo "Updating server configuration..."
cat > server/index.js << 'EOF'
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Import storage and routes
const { storage } = require('./storage');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting Career Portal server...');
console.log('Environment:', process.env.NODE_ENV || 'production');

// Trust proxy for production (behind Nginx)
app.set('trust proxy', 1);

// Enhanced session configuration for production
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000, // Clean up expired sessions every 24h
    ttl: 86400000, // Session TTL: 24 hours
    stale: false
  }),
  secret: process.env.SESSION_SECRET || 'career-portal-production-secret-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: {
    secure: false, // Set true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'career.portal.session'
}));

// Request parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS and security headers for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static file serving with multiple fallback paths
const possibleStaticPaths = [
  path.join(__dirname, '../dist/public'),
  path.join(__dirname, '../dist/client'), 
  path.join(__dirname, '../client/dist'),
  path.join(__dirname, '../build'),
  path.join(__dirname, '../public')
];

let staticPath = null;
for (const testPath of possibleStaticPaths) {
  if (fs.existsSync(testPath)) {
    staticPath = testPath;
    console.log('Static files found at:', staticPath);
    break;
  }
}

if (staticPath) {
  app.use(express.static(staticPath, {
    maxAge: '1d',
    etag: true
  }));
} else {
  console.warn('Warning: No static file directory found');
  // Create basic fallback
  app.get('/', (req, res) => {
    res.send(`
      <h1>Career Portal</h1>
      <p>Server is running but static files not found.</p>
      <p>Available paths checked: ${possibleStaticPaths.join(', ')}</p>
    `);
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    staticPath: staticPath || 'not found',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
  });
});

// Register API routes
registerRoutes(app).then(() => {
  console.log('API routes registered successfully');
}).catch(err => {
  console.error('Critical error registering routes:', err);
  process.exit(1);
});

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  if (staticPath) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`
        <h1>Application Error</h1>
        <p>index.html not found at: ${indexPath}</p>
        <p>Please run build process</p>
      `);
    }
  } else {
    res.status(404).send('Static files not configured');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack || err);
  
  if (!res.headersSent) {
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
});

// Start server with comprehensive error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Career Portal server running on port ${PORT}`);
  console.log(`📁 Static files: ${staticPath || 'Not found'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('Run: fuser -k 5000/tcp to kill existing processes');
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`${signal} received - shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Server initialization complete');
EOF

# Update PM2 ecosystem configuration
echo "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'career-portal',
    script: './server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      SESSION_SECRET: 'career-portal-production-secret-2024'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF

# Ensure proper directory structure
echo "Setting up directory structure..."
mkdir -p logs
mkdir -p uploads
chmod 755 uploads

# Fix build directory structure if needed
if [ ! -d "dist/public" ] && [ -d "dist/client" ]; then
  echo "Fixing build directory structure..."
  mkdir -p dist/public
  cp -r dist/client/* dist/public/ 2>/dev/null || true
fi

# Set environment variables
echo "Setting up environment..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
SESSION_SECRET=career-portal-production-secret-$(date +%s)
EOF

# Source environment
source .env 2>/dev/null || true

# Install/update dependencies
echo "Installing dependencies..."
npm install --production --no-optional

# Run database migration if needed
echo "Running database migration..."
node migrate.js 2>/dev/null || echo "Migration skipped or failed"

# Start application with PM2
echo "Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Wait for startup
sleep 5

# Verify application status
echo "Checking application status..."
if pm2 list | grep -q "career-portal.*online"; then
  echo "✅ Career Portal started successfully"
  
  # Test health endpoint
  health_response=$(curl -s -w "HTTP:%{http_code}" http://localhost:5000/health)
  if [[ $health_response == *"HTTP:200"* ]]; then
    echo "✅ Health check passed"
    echo "🌐 Application is running at http://162.243.190.66"
  else
    echo "⚠️  Health check failed: $health_response"
  fi
  
  echo "📊 Application logs:"
  pm2 logs career-portal --lines 5 --nostream
else
  echo "❌ Career Portal failed to start"
  echo "📊 Error logs:"
  pm2 logs career-portal --lines 10 --nostream
  exit 1
fi

echo ""
echo "🎉 Job creation fix deployment completed!"
echo "📝 Monitor logs: pm2 logs career-portal"
echo "🔄 Restart: pm2 restart career-portal"
echo "📊 Status: pm2 status"