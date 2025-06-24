#!/bin/bash
set -e

echo "Building Career Portal Docker Container..."

# Build the frontend first
echo "Building frontend..."
npm run build

# Create production server file
echo "Creating production server..."
cat > server-production.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import multer from 'multer';
import { createReadStream, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Session configuration
const sessions = new Map();

app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve static files
app.use(express.static('dist'));

// In-memory data storage
let userData = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', fullName: 'Admin User' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', fullName: 'Employee User' }
];

let jobData = [
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
  }
];

let applicationData = [];
let categoryData = [
  { id: 1, name: 'Engineering', description: 'Software development roles' },
  { id: 2, name: 'Marketing', description: 'Marketing and communications' },
  { id: 3, name: 'Sales', description: 'Sales and business development' }
];

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = userData.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    res.json({ id: user.id, username: user.username, role: user.role, fullName: user.fullName });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (req.session.userId) {
    const user = userData.find(u => u.id === req.session.userId);
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role, fullName: user.fullName });
    } else {
      res.status(401).json({ message: 'User not found' });
    }
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

// Job routes
app.get('/api/jobs', (req, res) => {
  res.json(jobData);
});

app.post('/api/jobs', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const user = userData.find(u => u.id === req.session.userId);
  if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const jobInfo = req.body.job || req.body;
  const newJob = {
    id: jobData.length + 1,
    title: jobInfo.title || 'Untitled Job',
    department: jobInfo.department || 'General',
    shortDescription: jobInfo.shortDescription || '',
    requirements: jobInfo.requirements || '',
    type: jobInfo.type || 'full-time',
    location: jobInfo.location || 'Remote',
    employeeId: user.id,
    postedBy: user.fullName,
    postedDate: new Date().toISOString()
  };
  
  jobData.push(newJob);
  res.json(newJob);
});

// Categories
app.get('/api/categories', (req, res) => {
  res.json(categoryData);
});

// Applications
app.get('/api/applications', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json(applicationData);
});

app.post('/api/applications', upload.single('resume'), (req, res) => {
  const newApplication = {
    id: applicationData.length + 1,
    jobId: parseInt(req.body.jobId),
    applicantName: req.body.applicantName,
    email: req.body.email,
    phone: req.body.phone,
    coverLetter: req.body.coverLetter,
    resumeFilename: req.file ? req.file.filename : null,
    status: 'pending',
    appliedDate: new Date().toISOString()
  };
  
  applicationData.push(newApplication);
  res.json(newApplication);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'Career Portal Docker',
    jobs: jobData.length,
    users: userData.length,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = join(__dirname, 'dist', 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Run npm run build first.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Career Portal running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
});
EOF

# Build Docker image
echo "Building Docker image..."
docker build -t career-portal:latest .

# Export Docker image
echo "Exporting Docker image..."
docker save career-portal:latest | gzip > career-portal-docker-export.tar.gz

echo "Docker container built and exported successfully!"
echo "Export file: career-portal-docker-export.tar.gz"
echo ""
echo "To deploy this container:"
echo "1. Copy career-portal-docker-export.tar.gz to your server"
echo "2. Load the image: docker load < career-portal-docker-export.tar.gz"
echo "3. Run the container: docker run -d -p 8080:8080 --name career-portal career-portal:latest"