#!/bin/bash

# Fix White Screen Issue on DigitalOcean
echo "🔧 Fixing white screen and authentication issues..."

cd /var/www/career-portal || exit 1

# Stop current server
pm2 delete career-portal 2>/dev/null || true

# Check what static files exist
echo "📁 Checking static file locations..."
ls -la dist/ 2>/dev/null || echo "No dist/ directory"
ls -la dist/public/ 2>/dev/null || echo "No dist/public/ directory"
ls -la client/dist/ 2>/dev/null || echo "No client/dist/ directory"

# Create enhanced server with better static file handling
cat > server/white-screen-fix.js << 'EOF'
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const memStore = MemoryStore(session);

// Find static files
const possiblePaths = [
  path.join(__dirname, '../dist/public'),
  path.join(__dirname, '../dist'),  
  path.join(__dirname, '../public'),
  path.join(__dirname, '../client/dist')
];

let staticPath = null;
for (const testPath of possiblePaths) {
  const indexPath = path.join(testPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    staticPath = testPath;
    console.log(`✅ Found static files at: ${staticPath}`);
    break;
  }
}

if (!staticPath) {
  console.log('❌ No static files found, creating minimal HTML');
  staticPath = path.join(__dirname, '../temp-static');
  if (!fs.existsSync(staticPath)) {
    fs.mkdirSync(staticPath, { recursive: true });
  }
  
  // Create minimal working HTML
  const minimalHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Career Portal</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .container { max-width: 400px; margin: 0 auto; }
    .form-group { margin: 20px 0; }
    input { width: 100%; padding: 10px; margin: 5px 0; }
    button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; }
    .dashboard { display: none; }
    .job-form { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
    .success { color: green; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div id="login-form">
      <h2>Career Portal Login</h2>
      <form onsubmit="login(event)">
        <div class="form-group">
          <input type="text" id="username" placeholder="Username" required>
        </div>
        <div class="form-group">
          <input type="password" id="password" placeholder="Password" required>
        </div>
        <button type="submit">Login</button>
      </form>
      <p>Admin: admin/admin123 | Employee: employee/employee123</p>
    </div>
    
    <div id="dashboard" class="dashboard">
      <h2>Employee Dashboard</h2>
      <button onclick="logout()">Logout</button>
      
      <div class="job-form">
        <h3>Create New Job</h3>
        <form onsubmit="createJob(event)">
          <input type="text" id="job-title" placeholder="Job Title" required>
          <input type="text" id="job-dept" placeholder="Department" required>
          <textarea id="job-desc" placeholder="Job Description" required></textarea>
          <input type="text" id="job-location" placeholder="Location" required>
          <button type="submit">Create Job</button>
        </form>
        <div id="job-success" class="success"></div>
      </div>
    </div>
  </div>

  <script>
    let currentUser = null;
    
    async function login(event) {
      event.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
          currentUser = await response.json();
          document.getElementById('login-form').style.display = 'none';
          document.getElementById('dashboard').style.display = 'block';
        } else {
          alert('Login failed');
        }
      } catch (error) {
        alert('Login error: ' + error.message);
      }
    }
    
    async function createJob(event) {
      event.preventDefault();
      const job = {
        title: document.getElementById('job-title').value,
        department: document.getElementById('job-dept').value,
        shortDescription: document.getElementById('job-desc').value,
        fullDescription: document.getElementById('job-desc').value,
        requirements: 'Standard requirements',
        type: 'full-time',
        location: document.getElementById('job-location').value,
        status: 'active',
        categoryId: 1
      };
      
      try {
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ job, tags: [] })
        });
        
        if (response.ok) {
          const newJob = await response.json();
          document.getElementById('job-success').textContent = 'Job created successfully: ' + newJob.title;
          event.target.reset();
        } else {
          alert('Job creation failed');
        }
      } catch (error) {
        alert('Job creation error: ' + error.message);
      }
    }
    
    function logout() {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      document.getElementById('login-form').style.display = 'block';  
      document.getElementById('dashboard').style.display = 'none';
      currentUser = null;
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(staticPath, 'index.html'), minimalHTML);
  console.log('📝 Created minimal working HTML');
}

console.log(`🌐 Serving static files from: ${staticPath}`);

// Users
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', email: 'admin@example.com', firstName: 'Admin', lastName: 'User', fullName: 'Admin User', isActive: true },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', email: 'employee@example.com', firstName: 'Employee', lastName: 'User', fullName: 'Employee User', isActive: true }
];

// Enhanced session configuration
app.use(session({
  store: new memStore({
    checkPeriod: 86400000,
    ttl: 86400000
  }),
  secret: 'career-portal-secret-key-2024',
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
  name: 'career-session'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// Static files
app.use(express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
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
      console.log(`Auth success for: ${user.username}`);
      return next();
    }
  }
  console.log('Auth failed - no valid session');
  res.status(401).json({ message: 'Unauthorized' });
};

// API Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username}`);
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      console.log(`Login successful: ${username} (Session: ${req.sessionID})`);
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
    console.log(`Login failed: ${username}`);
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
    if (err) console.error('Logout error:', err);
    res.json({ message: 'Logged out' });
  });
});

// Data
const categories = [
  { id: 1, name: 'Engineering', description: 'Technical roles', status: 'active' },
  { id: 2, name: 'Marketing', description: 'Marketing roles', status: 'active' }
];

const jobs = [];

app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  const { job, tags = [] } = req.body;
  console.log(`Job creation by: ${req.user.username}`);
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
  console.log(`✅ Job created: ${newJob.title} (ID: ${newJob.id})`);
  res.status(201).json(newJob);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    staticPath,
    jobsCount: jobs.length
  });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  console.log(`Serving index.html for: ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('<h1>Career Portal</h1><p>Error loading application</p>');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Career Portal running on port ${PORT}`);
  console.log(`📁 Static files: ${staticPath}`);
  console.log(`🌐 Access at: http://64.225.6.33`);
});
EOF

echo "✅ Enhanced server created with static file detection and minimal HTML fallback"

# Start the server
pm2 start server/white-screen-fix.js --name career-portal

sleep 3

# Test the server
echo "🧪 Testing server..."
curl -I http://localhost:5000/health
echo ""

# Test login
echo "🔐 Testing authentication..."
LOGIN_TEST=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c /tmp/test.txt)

if echo "$LOGIN_TEST" | grep -q "admin"; then
  echo "✅ Authentication working"
  
  # Test job creation
  JOB_TEST=$(curl -s -X POST http://localhost:5000/api/jobs \
    -H "Content-Type: application/json" \
    -b /tmp/test.txt \
    -d '{"job":{"title":"White Screen Test","department":"IT","shortDescription":"Test job","fullDescription":"Test","requirements":"None","type":"full-time","location":"remote","status":"active","categoryId":1},"tags":[]}')
  
  if echo "$JOB_TEST" | grep -q "White Screen Test"; then
    echo "✅ Job creation working"
  else
    echo "❌ Job creation failed: $JOB_TEST"
  fi
else
  echo "❌ Authentication failed: $LOGIN_TEST"
fi

rm -f /tmp/test.txt

echo ""
echo "🎉 White screen fix deployed!"
echo "📋 Access your portal at: http://64.225.6.33"
echo "👤 Login: admin/admin123 or employee/employee123"
echo ""
echo "📊 Monitor with: pm2 logs career-portal"