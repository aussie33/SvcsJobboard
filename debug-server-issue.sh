#!/bin/bash

# Debug and fix the 502 gateway error
# Run this on your DigitalOcean server

cd /var/www/career-portal

echo "Checking PM2 logs for errors..."
pm2 logs career-portal --lines 20

echo ""
echo "Checking if port 5000 is actually listening..."
netstat -tlnp | grep 5000

echo ""
echo "Checking process details..."
pm2 describe career-portal

echo ""
echo "Checking for ES module issues in server/index.js..."
node --check server/index.js

echo ""
echo "The issue is likely that server/index.js is using ES modules syntax but needs CommonJS"
echo "Let's fix the server file..."

# Create a CommonJS compatible server file
cat > server/index.js << 'EOF'
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const path = require('path');
const fs = require('fs');

// Import modules using require (CommonJS)
let storage, registerRoutes;

// Dynamic import for ES modules
async function loadModules() {
  try {
    const storageModule = await import('./storage.js');
    const routesModule = await import('./routes.js');
    
    storage = storageModule.storage;
    registerRoutes = routesModule.registerRoutes;
    
    return true;
  } catch (error) {
    console.error('Error loading ES modules:', error);
    
    // Fallback to CommonJS require
    try {
      const storageModule = require('./storage');
      const routesModule = require('./routes');
      
      storage = storageModule.storage;
      registerRoutes = routesModule.registerRoutes;
      
      return true;
    } catch (fallbackError) {
      console.error('Error with CommonJS fallback:', fallbackError);
      return false;
    }
  }
}

async function startServer() {
  console.log('Starting Career Portal server...');
  
  // Load modules first
  const modulesLoaded = await loadModules();
  if (!modulesLoaded) {
    console.error('Failed to load required modules');
    process.exit(1);
  }
  
  const app = express();
  const PORT = process.env.PORT || 5000;

  console.log('Modules loaded successfully');
  console.log('Environment:', process.env.NODE_ENV || 'production');

  // Trust proxy for production
  app.set('trust proxy', 1);

  // Session configuration
  app.use(session({
    store: new MemoryStore({
      checkPeriod: 86400000,
      ttl: 86400000
    }),
    secret: process.env.SESSION_SECRET || 'career-portal-secret-2024',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static files
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
      console.log('Static files found at:', staticPath);
      break;
    }
  }

  if (staticPath) {
    app.use(express.static(staticPath));
  } else {
    console.warn('No static files found, serving basic response');
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      staticPath: staticPath || 'not found',
      uptime: Math.floor(process.uptime())
    });
  });

  // Register API routes
  try {
    await registerRoutes(app);
    console.log('API routes registered successfully');
  } catch (error) {
    console.error('Error registering routes:', error);
    process.exit(1);
  }

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    if (staticPath) {
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('index.html not found');
      }
    } else {
      res.send(`
        <h1>Career Portal</h1>
        <p>Server is running but static files not found.</p>
        <p>Available at: <a href="/health">/health</a></p>
      `);
    }
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Start server
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Career Portal server running on port ${PORT}`);
    console.log(`📁 Static path: ${staticPath || 'Not found'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  }).on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down');
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down');
    server.close(() => process.exit(0));
  });
}

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
EOF

echo ""
echo "Restarting server with fixed configuration..."
pm2 restart career-portal

# Wait for startup
sleep 5

echo ""
echo "Testing health endpoint..."
curl -v http://localhost:5000/health

echo ""
echo "Checking PM2 status..."
pm2 status

echo ""
echo "If still having issues, check logs:"
echo "pm2 logs career-portal"