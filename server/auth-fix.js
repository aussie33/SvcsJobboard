import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const memStore = MemoryStore(session);

// Simple in-memory users for testing
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee' }
];

// Session configuration
app.use(session({
  store: new memStore({
    checkPeriod: 86400000,
    ttl: 86400000
  }),
  secret: 'simple-auth-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    maxAge: 86400000,
    sameSite: 'lax',
    secure: false
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist/public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple auth middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      req.user = user;
      return next();
    }
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Login failed' });
      }
      console.log('Login successful for user:', username, 'Session ID:', req.sessionID);
      res.json({ id: user.id, username: user.username, role: user.role });
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Simple job routes
const jobs = [
  { id: 1, title: 'Frontend Developer', department: 'Engineering', employeeId: 1 }
];

app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Engineering', description: 'Tech roles' },
    { id: 2, name: 'Marketing', description: 'Marketing roles' }
  ]);
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  const { job } = req.body;
  const newJob = {
    ...job,
    id: jobs.length + 1,
    employeeId: req.user.id,
    postedDate: new Date()
  };
  jobs.push(newJob);
  console.log('Job created by user:', req.user.username, 'Job:', newJob.title);
  res.status(201).json(newJob);
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Simple auth server running on port 5000');
});
