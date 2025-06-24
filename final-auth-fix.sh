#!/bin/bash

cd /var/www/career-portal
pm2 delete career-portal 2>/dev/null || true

cat > server/final-auth-fix.js << 'EOF'
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const memStore = MemoryStore(session);

const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', email: 'admin@theresonance.com', firstName: 'Admin', lastName: 'User', fullName: 'Admin User', isActive: true },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', email: 'employee@theresonance.com', firstName: 'Employee', lastName: 'User', fullName: 'Employee User', isActive: true }
];

// Enhanced session configuration with explicit save
app.use(session({
  store: new memStore({
    checkPeriod: 86400000,
    ttl: 86400000
  }),
  secret: 'career-portal-production-secret-2024',
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
  name: 'career-session-id'
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist/public')));

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Detailed logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Session: ${req.sessionID}`);
  }
  next();
});

const requireAuth = (req, res, next) => {
  console.log(`Auth check - SessionID: ${req.sessionID}, UserID: ${req.session?.userId}, Session exists: ${!!req.session}`);
  if (req.session && req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
      console.log(`Auth SUCCESS for: ${user.username} (${user.role})`);
      return next();
    }
  }
  console.log('Auth FAILED - no valid session or user');
  res.status(401).json({ message: 'Unauthorized' });
};

// Login with explicit session save and validation
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`LOGIN ATTEMPT: ${username}`);
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save ERROR:', err);
        return res.status(500).json({ message: 'Login failed - session error' });
      }
      
      console.log(`LOGIN SUCCESS: ${username} - Session: ${req.sessionID} - UserID: ${user.id}`);
      
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      };
      
      res.json(userResponse);
    });
  } else {
    console.log(`LOGIN FAILED: Invalid credentials for ${username}`);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  console.log(`ME REQUEST SUCCESS for: ${req.user.username}`);
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
  console.log(`LOGOUT REQUEST - Session: ${req.sessionID}`);
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.json({ message: 'Logged out successfully' });
  });
});

const categories = [
  { id: 1, name: 'Engineering', description: 'Technical roles', status: 'active' },
  { id: 2, name: 'Marketing', description: 'Marketing roles', status: 'active' },
  { id: 3, name: 'Sales', description: 'Sales roles', status: 'active' }
];

const jobs = [];
let jobCounter = 1;

app.get('/api/categories', (req, res) => {
  console.log('CATEGORIES REQUEST');
  res.json(categories);
});

app.get('/api/jobs', (req, res) => {
  console.log(`JOBS REQUEST - Count: ${jobs.length}`);
  res.json(jobs);
});

app.get('/api/applications', requireAuth, (req, res) => {
  console.log('APPLICATIONS REQUEST');
  res.json([]);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  console.log(`JOB CREATION by: ${req.user.username} (${req.user.role})`);
  console.log('Job data received:', JSON.stringify(req.body, null, 2));
  
  const jobData = req.body.job || req.body;
  
  if (!jobData.title || !jobData.department) {
    console.log('MISSING REQUIRED FIELDS:', { title: jobData.title, department: jobData.department });
    return res.status(400).json({ message: 'Title and department are required' });
  }
  
  const newJob = {
    id: jobCounter++,
    title: jobData.title,
    department: jobData.department,
    categoryId: jobData.categoryId || 1,
    shortDescription: jobData.shortDescription || jobData.description || '',
    fullDescription: jobData.fullDescription || jobData.description || jobData.shortDescription || '',
    requirements: jobData.requirements || '',
    type: jobData.type || 'full-time',
    location: jobData.location || 'remote',
    status: jobData.status || 'active',
    employeeId: req.user.id,
    postedDate: new Date(),
    expiryDate: null
  };
  
  jobs.push(newJob);
  console.log(`JOB CREATED SUCCESSFULLY: "${newJob.title}" (ID: ${newJob.id}) - Total jobs: ${jobs.length}`);
  res.status(201).json(newJob);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    jobsCount: jobs.length,
    usersCount: users.length,
    sessionId: req.sessionID
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    console.log(`API 404: ${req.path}`);
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(5000, '0.0.0.0', () => {
  console.log('=== Career Portal Server Started ===');
  console.log('Port: 5000');
  console.log('URL: http://64.225.6.33');
  console.log('Users available:', users.map(u => `${u.username}/${u.password}`));
  console.log('=====================================');
});
EOF

pm2 start server/final-auth-fix.js --name career-portal
sleep 3

echo "Testing the enhanced authentication..."

# Test login functionality
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c /tmp/test_session.txt \
  -s | head -100

echo ""
echo "Testing session persistence..."

# Test if session persists
curl -X GET http://localhost:5000/api/auth/me \
  -b /tmp/test_session.txt \
  -s | head -100

echo ""
echo "Testing job creation..."

# Test job creation
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -b /tmp/test_session.txt \
  -d '{"job":{"title":"Final Test Job","department":"Engineering","shortDescription":"Test job","type":"full-time","location":"remote","status":"active"}}' \
  -s | head -100

rm -f /tmp/test_session.txt

echo ""
echo "Check detailed logs with: pm2 logs career-portal"
echo "Enhanced authentication server deployed at http://64.225.6.33"