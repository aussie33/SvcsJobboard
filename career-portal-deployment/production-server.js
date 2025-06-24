const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-production-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Serve static files
app.use(express.static('dist'));
app.use(express.static('public'));

// In-memory data storage
let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', fullName: 'Admin User' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', fullName: 'Employee User' }
];

let jobs = [
  {
    id: 1,
    title: 'Senior Software Engineer',
    department: 'Engineering',
    shortDescription: 'Build scalable web applications with React, Node.js, and PostgreSQL',
    requirements: '5+ years experience with React, Node.js, TypeScript, REST APIs',
    type: 'full-time',
    location: 'San Francisco, CA',
    employeeId: 2,
    postedBy: 'Employee User',
    postedDate: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Marketing Manager',
    department: 'Marketing',
    shortDescription: 'Lead marketing initiatives and brand development',
    requirements: '3+ years marketing experience, strong analytical skills',
    type: 'full-time',
    location: 'New York, NY',
    employeeId: 2,
    postedBy: 'Employee User',
    postedDate: new Date().toISOString()
  }
];

let applications = [];

let categories = [
  { id: 1, name: 'Engineering', description: 'Software development and technical roles' },
  { id: 2, name: 'Marketing', description: 'Marketing, communications, and brand management' },
  { id: 3, name: 'Sales', description: 'Sales and business development roles' },
  { id: 4, name: 'Operations', description: 'Operations and administrative roles' }
];

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      fullName: user.fullName 
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.userId) {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
      res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        fullName: user.fullName 
      });
    } else {
      res.status(401).json({ message: 'User not found' });
    }
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Job routes
app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = users.find(u => u.id === req.session.userId);
  if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const jobData = req.body.job || req.body;
  
  const newJob = {
    id: jobs.length + 1,
    title: jobData.title || 'New Job Position',
    department: jobData.department || 'General',
    shortDescription: jobData.shortDescription || '',
    requirements: jobData.requirements || '',
    type: jobData.type || 'full-time',
    location: jobData.location || 'Remote',
    employeeId: user.id,
    postedBy: user.fullName,
    postedDate: new Date().toISOString()
  };
  
  jobs.push(newJob);
  res.json(newJob);
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ message: 'Job not found' });
  }
});

// Category routes
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// Application routes
app.get('/api/applications', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = users.find(u => u.id === req.session.userId);
  if (user.role === 'employee' || user.role === 'admin') {
    res.json(applications);
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
});

app.post('/api/applications', upload.single('resume'), (req, res) => {
  const newApplication = {
    id: applications.length + 1,
    jobId: parseInt(req.body.jobId),
    applicantName: req.body.applicantName,
    email: req.body.email,
    phone: req.body.phone,
    coverLetter: req.body.coverLetter,
    resumeFilename: req.file ? req.file.filename : null,
    status: 'pending',
    appliedDate: new Date().toISOString()
  };
  
  applications.push(newApplication);
  res.json(newApplication);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    server: 'Career Portal Production',
    version: '1.0.0',
    jobs: jobs.length,
    users: users.length,
    applications: applications.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback HTML if build not available
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Career Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        h1 { color: #333; margin-bottom: 1rem; }
        .status { 
            background: #10b981; 
            color: white; 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            margin: 1rem 0;
            display: inline-block;
        }
        .info { 
            background: #f8f9fa; 
            padding: 1rem; 
            border-radius: 6px; 
            margin: 1rem 0;
            text-align: left;
        }
        .accounts { background: #e3f2fd; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.25rem 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Career Portal</h1>
        <div class="status">Production Server Running</div>
        
        <div class="info">
            <h3>Server Status</h3>
            <ul>
                <li><strong>Port:</strong> ${PORT}</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</li>
                <li><strong>Started:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Jobs Available:</strong> ${jobs.length}</li>
            </ul>
        </div>
        
        <div class="info accounts">
            <h3>Test Accounts</h3>
            <ul>
                <li><strong>Employee:</strong> employee / employee123</li>
                <li><strong>Admin:</strong> admin / admin123</li>
            </ul>
        </div>
        
        <div class="info">
            <p><strong>Note:</strong> Build the React frontend with <code>npm run build</code> to see the full application interface.</p>
        </div>
    </div>
</body>
</html>
    `);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Career Portal running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`👥 Sample accounts: employee/employee123, admin/admin123`);
  console.log(`💼 Sample jobs: ${jobs.length} available`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
});
