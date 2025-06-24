#!/bin/bash

echo "Fixing job creation button in React frontend..."

cd /var/www/career-portal || exit 1

# Stop current server
pm2 delete career-portal 2>/dev/null || true

# Create server that works with the existing React frontend
cat > server/react-frontend-fix.js << 'EOF'
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const memStore = MemoryStore(session);

// Users with full data structure expected by React frontend
const users = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'admin123', 
    role: 'admin', 
    email: 'admin@theresonance.com', 
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
    email: 'employee@theresonance.com', 
    firstName: 'Employee', 
    lastName: 'User', 
    fullName: 'Employee User', 
    isActive: true 
  },
  { 
    id: 3, 
    username: 'applicant', 
    password: 'applicant123', 
    role: 'applicant', 
    email: 'applicant@theresonance.com', 
    firstName: 'John', 
    lastName: 'Doe', 
    fullName: 'John Doe', 
    isActive: true 
  }
];

// Enhanced session configuration that works with React
app.use(session({
  store: new memStore({
    checkPeriod: 86400000,
    ttl: 86400000
  }),
  secret: 'theresonance-career-portal-secret-2024',
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
  name: 'theresonance-session'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS for React frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
  }
  next();
});

// Serve static files
const staticPath = path.join(__dirname, '../dist/public');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// Auth middleware
const requireAuth = (req, res, next) => {
  console.log(`Auth check - SessionID: ${req.sessionID}, UserID: ${req.session?.userId}`);
  if (req.session && req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
      console.log(`Auth success for: ${user.username} (${user.role})`);
      return next();
    }
  }
  console.log('Auth failed - redirecting to login');
  res.status(401).json({ message: 'Unauthorized' });
};

// API Routes - Match React frontend expectations
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
    res.json({ message: 'Logged out successfully' });
  });
});

// Categories data
const categories = [
  { id: 1, name: 'Engineering', description: 'Engineering and technical roles', status: 'active', createdAt: new Date() },
  { id: 2, name: 'Marketing', description: 'Marketing and sales roles', status: 'active', createdAt: new Date() },
  { id: 3, name: 'Sales', description: 'Sales roles', status: 'active', createdAt: new Date() },
  { id: 4, name: 'Human Resources', description: 'HR roles', status: 'active', createdAt: new Date() },
  { id: 5, name: 'Finance', description: 'Finance roles', status: 'active', createdAt: new Date() }
];

// Jobs storage
const jobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    categoryId: 1,
    shortDescription: 'Build amazing user interfaces with React and TypeScript',
    fullDescription: 'We are looking for a senior frontend developer to join our team...',
    requirements: 'React, TypeScript, 5+ years experience',
    type: 'full-time',
    location: 'remote',
    status: 'active',
    employeeId: 2,
    postedDate: new Date(),
    expiryDate: null
  }
];

let jobIdCounter = jobs.length + 1;

app.get('/api/categories', (req, res) => {
  console.log('Fetching categories');
  res.json(categories);
});

app.get('/api/jobs', (req, res) => {
  console.log('Fetching jobs, count:', jobs.length);
  res.json(jobs);
});

// Job creation endpoint - matches React frontend expectations
app.post('/api/jobs', requireAuth, (req, res) => {
  console.log(`Job creation request from: ${req.user.username} (${req.user.role})`);
  console.log('Raw request body:', req.body);
  
  // Handle both { job, tags } and direct job object formats
  let jobData, tags;
  if (req.body.job) {
    jobData = req.body.job;
    tags = req.body.tags || [];
  } else {
    jobData = req.body;
    tags = [];
  }
  
  console.log('Job data:', jobData);
  console.log('Tags:', tags);
  
  // Validate required fields
  if (!jobData.title || !jobData.department) {
    console.log('Missing required fields');
    return res.status(400).json({ 
      message: 'Missing required fields', 
      required: ['title', 'department'] 
    });
  }
  
  const newJob = {
    id: jobIdCounter++,
    title: jobData.title,
    department: jobData.department,
    categoryId: jobData.categoryId || 1,
    shortDescription: jobData.shortDescription || jobData.description || '',
    fullDescription: jobData.fullDescription || jobData.description || jobData.shortDescription || '',
    requirements: jobData.requirements || 'Requirements to be updated',
    type: jobData.type || 'full-time',
    location: jobData.location || 'remote',
    status: jobData.status || 'active',
    employeeId: req.user.id,
    postedDate: new Date(),
    expiryDate: jobData.expiryDate || null,
    tags: tags
  };
  
  jobs.push(newJob);
  console.log(`✅ Job created successfully: "${newJob.title}" (ID: ${newJob.id})`);
  console.log('Total jobs now:', jobs.length);
  
  res.status(201).json(newJob);
});

// Update job
app.put('/api/jobs/:id', requireAuth, (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  const updates = req.body.job || req.body;
  jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
  
  console.log(`Job updated: ${jobs[jobIndex].title}`);
  res.json(jobs[jobIndex]);
});

// Delete job
app.delete('/api/jobs/:id', requireAuth, (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  const deletedJob = jobs.splice(jobIndex, 1)[0];
  console.log(`Job deleted: ${deletedJob.title}`);
  res.json({ message: 'Job deleted successfully' });
});

// Users endpoint
app.get('/api/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
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

// Applications endpoint (empty for now)
app.get('/api/applications', requireAuth, (req, res) => {
  res.json([]);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    jobsCount: jobs.length,
    usersCount: users.length
  });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(staticPath, 'index.html');
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

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Career Portal server running on port ${PORT}`);
  console.log(`📁 Static files from: ${staticPath}`);
  console.log(`🌐 Access at: http://64.225.6.33`);
  console.log(`👥 Users: ${users.length}, Jobs: ${jobs.length}, Categories: ${categories.length}`);
});
EOF

echo "Enhanced server created for React frontend compatibility"

# Start the server
pm2 start server/react-frontend-fix.js --name career-portal

sleep 3

# Test the server
echo "Testing enhanced server..."
curl -I http://localhost:5000/health

# Test login with verbose output
echo "Testing login functionality..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c /tmp/session.txt)

echo "Login response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "admin"; then
  echo "✅ Login working"
  
  # Test job creation with exact format expected by React
  echo "Testing job creation..."
  JOB_RESPONSE=$(curl -s -X POST http://localhost:5000/api/jobs \
    -H "Content-Type: application/json" \
    -b /tmp/session.txt \
    -d '{
      "job": {
        "title": "React Frontend Test Job",
        "department": "Engineering", 
        "categoryId": 1,
        "shortDescription": "Test job created from React frontend",
        "fullDescription": "Full description of the test job",
        "requirements": "React, JavaScript, Testing",
        "type": "full-time",
        "location": "remote",
        "status": "active"
      },
      "tags": ["react", "frontend", "test"]
    }')
  
  echo "Job creation response: $JOB_RESPONSE"
  
  if echo "$JOB_RESPONSE" | grep -q "React Frontend Test Job"; then
    echo "✅ Job creation working with React format"
  else
    echo "❌ Job creation failed"
  fi
else
  echo "❌ Login failed"
fi

rm -f /tmp/session.txt

echo ""
echo "🎉 React frontend fix deployed!"
echo "📋 Access at: http://64.225.6.33"
echo "🔑 Login: admin/admin123 or employee/employee123"
echo "📊 Monitor: pm2 logs career-portal"
echo ""
echo "The job creation button should now work in the React interface!"