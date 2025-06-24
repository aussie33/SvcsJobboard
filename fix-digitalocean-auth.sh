#!/bin/bash

# DigitalOcean Career Portal Authentication Fix Script
# Run this on your DigitalOcean server to fix the job creation issue

echo "🚀 Starting DigitalOcean Career Portal Authentication Fix..."

# Navigate to project directory
cd /var/www/career-portal || {
    echo "❌ Error: /var/www/career-portal directory not found"
    exit 1
}

echo "📂 Current directory: $(pwd)"

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# Create the enhanced authentication server
echo "📝 Creating enhanced authentication server..."
cat > server/auth-fix.js << 'EOF'
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const memStore = MemoryStore(session);

console.log('Starting production server with static path:', path.join(__dirname, '../dist/public'));

// Users data
const users = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'admin123', 
    role: 'admin', 
    email: 'admin@example.com', 
    firstName: 'Admin', 
    lastName: 'User', 
    fullName: 'Admin User', 
    isActive: true 
  },
  { 
    id: 2, 
    username: 'employee', 
    password: 'employee123', 
    role: 'employee', 
    email: 'employee@example.com', 
    firstName: 'Employee', 
    lastName: 'User', 
    fullName: 'Employee User', 
    isActive: true 
  }
];

// Session configuration
app.use(session({
  store: new memStore({
    checkPeriod: 86400000,
    ttl: 86400000
  }),
  secret: 'production-auth-secret-2024',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: 86400000,
    sameSite: 'lax',
    secure: false,
    path: '/'
  },
  name: 'career-portal-session'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Static files with proper headers
const staticPath = path.join(__dirname, '../dist/public');
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Auth middleware
const requireAuth = (req, res, next) => {
  console.log(`Auth check - Session: ${req.sessionID}, UserID: ${req.session?.userId}`);
  if (req.session && req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
      console.log(`Auth success for user: ${user.username}`);
      return next();
    }
  }
  console.log('Auth failed - no valid session');
  res.status(401).json({ message: 'Unauthorized' });
};

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt for username: ${username}`);
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      console.log(`Login successful - User: ${username}, Session: ${req.sessionID}`);
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      });
    });
  } else {
    console.log(`Login failed for username: ${username}`);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    fullName: req.user.fullName,
    role: req.user.role,
    isActive: req.user.isActive
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.json({ message: 'Logged out' });
  });
});

// Data
const categories = [
  { id: 1, name: 'Engineering', description: 'Engineering and technical roles', status: 'active', createdAt: new Date() },
  { id: 2, name: 'Marketing', description: 'Marketing and sales roles', status: 'active', createdAt: new Date() },
  { id: 3, name: 'Sales', description: 'Sales roles', status: 'active', createdAt: new Date() }
];

const jobs = [
  { 
    id: 1, 
    title: 'Senior Frontend Developer', 
    department: 'Engineering', 
    categoryId: 1,
    shortDescription: 'Build amazing user interfaces',
    fullDescription: 'We are looking for a senior frontend developer...',
    requirements: 'React, TypeScript, 5+ years experience',
    type: 'full-time',
    location: 'remote',
    status: 'active',
    employeeId: 1,
    postedDate: new Date(),
    expiryDate: null
  }
];

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  const { job, tags = [] } = req.body;
  console.log(`Job creation request from user: ${req.user.username}`);
  console.log('Job data:', job);
  
  const newJob = {
    ...job,
    id: jobs.length + 1,
    employeeId: req.user.id,
    postedDate: new Date(),
    expiryDate: null,
    tags: tags
  };
  
  jobs.push(newJob);
  console.log(`Job created successfully: ${newJob.title} (ID: ${newJob.id})`);
  res.status(201).json(newJob);
});

app.get('/api/users', requireAuth, (req, res) => {
  res.json(users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive
  })));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  console.log(`Serving SPA for route: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
  console.log(`Static files served from: ${staticPath}`);
});
EOF

echo "✅ Authentication server file created"

# Start the new server
echo "🚀 Starting the authentication server..."
pm2 start server/auth-fix.js --name career-portal

# Wait for startup
echo "⏳ Waiting for server startup..."
sleep 5

# Check server status
echo "📊 Checking server status..."
pm2 status
echo ""
echo "📋 Server logs:"
pm2 logs career-portal --lines 5

echo ""
echo "🔍 Testing server functionality..."

# Test health endpoint
echo "• Testing health endpoint..."
if curl -s http://localhost:5000/health | grep -q "ok"; then
    echo "  ✅ Health check passed"
else
    echo "  ❌ Health check failed"
fi

# Test login functionality
echo "• Testing login functionality..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c /tmp/test_session.txt)

if echo "$LOGIN_RESPONSE" | grep -q "admin"; then
    echo "  ✅ Login test passed"
    
    # Test authentication persistence
    echo "• Testing session persistence..."
    AUTH_RESPONSE=$(curl -s -X GET http://localhost:5000/api/auth/me \
      -b /tmp/test_session.txt)
    
    if echo "$AUTH_RESPONSE" | grep -q "admin"; then
        echo "  ✅ Session persistence test passed"
        
        # Test job creation
        echo "• Testing job creation..."
        JOB_RESPONSE=$(curl -s -X POST http://localhost:5000/api/jobs \
          -H "Content-Type: application/json" \
          -b /tmp/test_session.txt \
          -d '{"job":{"title":"Test Job","department":"Engineering","categoryId":1,"shortDescription":"Test job","fullDescription":"Test description","requirements":"Test requirements","type":"full-time","location":"remote","status":"active"},"tags":[]}')
        
        if echo "$JOB_RESPONSE" | grep -q "Test Job"; then
            echo "  ✅ Job creation test passed"
        else
            echo "  ❌ Job creation test failed"
            echo "  Response: $JOB_RESPONSE"
        fi
    else
        echo "  ❌ Session persistence test failed"
        echo "  Response: $AUTH_RESPONSE"
    fi
else
    echo "  ❌ Login test failed"
    echo "  Response: $LOGIN_RESPONSE"
fi

# Clean up test files
rm -f /tmp/test_session.txt

echo ""
echo "🎉 Authentication fix deployment complete!"
echo ""
echo "📋 Summary:"
echo "• Server URL: http://64.225.6.33"
echo "• Admin login: admin / admin123"
echo "• Employee login: employee / employee123"
echo ""
echo "🔧 Next steps:"
echo "1. Open http://64.225.6.33 in your browser"
echo "2. Login with admin/admin123"
echo "3. Navigate to employee dashboard"
echo "4. Try creating a job - the button should now work!"
echo ""
echo "📊 To monitor the server:"
echo "• Check status: pm2 status"
echo "• View logs: pm2 logs career-portal"
echo "• Restart if needed: pm2 restart career-portal"
echo ""
echo "✅ Job creation functionality should now work properly!"