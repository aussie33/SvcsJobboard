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

const categories = [
  { id: 1, name: 'Engineering', description: 'Software development and technical roles', status: 'active', createdAt: new Date() },
  { id: 2, name: 'Marketing', description: 'Marketing and promotional roles', status: 'active', createdAt: new Date() },
  { id: 3, name: 'Sales', description: 'Sales and business development', status: 'active', createdAt: new Date() },
  { id: 4, name: 'Human Resources', description: 'HR and people operations', status: 'active', createdAt: new Date() },
  { id: 5, name: 'Finance', description: 'Financial and accounting roles', status: 'active', createdAt: new Date() },
  { id: 6, name: 'Operations', description: 'Operations and logistics', status: 'active', createdAt: new Date() }
];

const jobs = [];
let jobCounter = 1;

app.use(session({
  store: new memStore({ checkPeriod: 86400000, ttl: 86400000 }),
  secret: 'career-portal-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 86400000, sameSite: 'lax', secure: false }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../dist/public')));
app.use('/assets', express.static(path.join(__dirname, '../dist/public/assets')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
  console.log(`Login attempt: ${username}`);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.userId = user.id;
    req.session.save(() => {
      console.log(`✓ Login successful: ${username} (${user.role})`);
      res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, role: user.role, isActive: user.isActive });
    });
  } else {
    console.log(`✗ Login failed: ${username}`);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, email: req.user.email, firstName: req.user.firstName, lastName: req.user.lastName, fullName: req.user.fullName, role: req.user.role, isActive: req.user.isActive });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/categories', (req, res) => {
  console.log('Categories requested');
  res.json(categories);
});

app.get('/api/jobs', (req, res) => {
  console.log(`Jobs requested: ${jobs.length} available`);
  res.json(jobs);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  console.log('Job creation request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user.username);
  
  try {
    const jobData = req.body.job || req.body;
    
    if (!jobData.title || !jobData.department) {
      return res.status(400).json({ 
        message: 'Missing required fields: title and department are required' 
      });
    }
    
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
      salaryRange: jobData.salaryRange || '',
      status: jobData.status || 'active',
      employeeId: req.user.id,
      postedDate: new Date().toISOString(),
      expiryDate: jobData.expiryDate || null
    };
    
    jobs.push(newJob);
    console.log(`✓ Job created successfully: "${newJob.title}" by ${req.user.username}`);
    console.log(`Total jobs: ${jobs.length}`);
    
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Failed to create job', error: error.message });
  }
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ message: 'Job not found' });
  }
});

app.put('/api/jobs/:id', requireAuth, (req, res) => {
  const jobId = parseInt(req.params.id);
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  const jobData = req.body.job || req.body;
  const updatedJob = { ...jobs[jobIndex], ...jobData };
  jobs[jobIndex] = updatedJob;
  
  console.log(`Job updated: ${updatedJob.title}`);
  res.json(updatedJob);
});

app.get('/api/applications', requireAuth, (req, res) => {
  res.json([]);
});

app.post('/api/applications', (req, res) => {
  console.log('Application submitted');
  res.status(201).json({ id: 1, message: 'Application submitted successfully' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(), 
    categoriesCount: categories.length, 
    jobsCount: jobs.length,
    usersCount: users.length,
    sessionId: req.session?.id || 'none'
  });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('=== Career Portal Server Started ===');
  console.log(`Port: ${PORT}`);
  console.log(`URL: http://64.225.6.33`);
  console.log(`Users available: [ 'admin/admin123', 'employee/employee123' ]`);
  console.log(`Categories: ${categories.length} loaded`);
  console.log(`Jobs: ${jobs.length} available`);
  console.log('=====================================');
});
