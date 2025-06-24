#!/bin/bash

cd /var/www/career-portal
pm2 delete career-portal 2>/dev/null || true

# Create simple working server
cat > server/simple-fix.js << 'EOF'
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

app.use(session({
  store: new memStore({ checkPeriod: 86400000, ttl: 86400000 }),
  secret: 'career-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 86400000, sameSite: 'lax', secure: false }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const requireAuth = (req, res, next) => {
  if (req.session?.userId) {
    req.user = users.find(u => u.id === req.session.userId);
    if (req.user) return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.userId = user.id;
    req.session.save(() => {
      res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, role: user.role, isActive: user.isActive });
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, email: req.user.email, firstName: req.user.firstName, lastName: req.user.lastName, fullName: req.user.fullName, role: req.user.role, isActive: req.user.isActive });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

const categories = [
  { id: 1, name: 'Engineering', description: 'Technical roles', status: 'active' },
  { id: 2, name: 'Marketing', description: 'Marketing roles', status: 'active' }
];

const jobs = [];
let jobCounter = 1;

app.get('/api/categories', (req, res) => res.json(categories));
app.get('/api/jobs', (req, res) => res.json(jobs));
app.get('/api/applications', requireAuth, (req, res) => res.json([]));

app.post('/api/jobs', requireAuth, (req, res) => {
  console.log('Job creation request:', req.body);
  const jobData = req.body.job || req.body;
  const newJob = {
    id: jobCounter++,
    title: jobData.title,
    department: jobData.department,
    categoryId: jobData.categoryId || 1,
    shortDescription: jobData.shortDescription || '',
    fullDescription: jobData.fullDescription || '',
    requirements: jobData.requirements || '',
    type: jobData.type || 'full-time',
    location: jobData.location || 'remote',
    status: jobData.status || 'active',
    employeeId: req.user.id,
    postedDate: new Date(),
    expiryDate: null
  };
  jobs.push(newJob);
  console.log('Job created:', newJob.title);
  res.status(201).json(newJob);
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
EOF

pm2 start server/simple-fix.js --name career-portal
sleep 2
pm2 logs career-portal --lines 5

echo "Fixed server deployed. Test at http://64.225.6.33"