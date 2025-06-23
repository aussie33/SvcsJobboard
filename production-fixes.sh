#!/bin/bash

# Production Environment Fixes for Job Creation
# This script addresses differences between Replit and DigitalOcean environments

echo "🔧 Applying production fixes for job creation..."

# Fix 1: Update server configuration for production
echo "Updating server configuration..."
cat > /var/www/career-portal/server/index.js << 'EOF'
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

// Trust proxy for production
app.set('trust proxy', 1);

// Session configuration for production
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'career-portal-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - serve client build
app.use(express.static(path.join(__dirname, '../dist/public')));

// API routes
registerRoutes(app).then(() => {
  console.log('Routes registered successfully');
}).catch(err => {
  console.error('Error registering routes:', err);
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not found. Please run build first.');
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
EOF

# Fix 2: Update PM2 ecosystem file
echo "Creating PM2 ecosystem configuration..."
cat > /var/www/career-portal/ecosystem.config.js << 'EOF'
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
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Fix 3: Ensure proper file permissions and directories
echo "Setting up directories and permissions..."
mkdir -p /var/www/career-portal/logs
mkdir -p /var/www/career-portal/uploads
chmod 755 /var/www/career-portal/uploads
chown -R www-data:www-data /var/www/career-portal/uploads

# Fix 4: Update Nginx configuration for better API handling
echo "Updating Nginx configuration..."
cat > /etc/nginx/sites-available/career-portal << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 50M;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        root /var/www/career-portal/dist/public;
        index index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Fix 5: Create startup script for better service management
echo "Creating startup script..."
cat > /var/www/career-portal/start.sh << 'EOF'
#!/bin/bash
cd /var/www/career-portal

# Kill any existing processes on port 5000
sudo fuser -k 5000/tcp 2>/dev/null || true

# Wait a moment
sleep 2

# Start the application with PM2
pm2 delete career-portal 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
EOF

chmod +x /var/www/career-portal/start.sh

# Fix 6: Update environment variables
echo "Setting up environment variables..."
cat > /var/www/career-portal/.env << EOF
NODE_ENV=production
PORT=5000
SESSION_SECRET=career-portal-secret-$(date +%s)
DATABASE_URL=${DATABASE_URL}
EOF

# Fix 7: Restart services
echo "Restarting services..."
cd /var/www/career-portal

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Install/update dependencies
npm install --production

# Run database migration
node migrate.js

# Start the application
./start.sh

# Restart Nginx
systemctl restart nginx

echo "✅ Production fixes applied successfully!"
echo "📝 Application should now be running on port 5000"
echo "🌐 Nginx is configured to proxy requests"
echo "📊 Check logs with: pm2 logs career-portal"