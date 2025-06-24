const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'career-portal-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Data
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', fullName: 'Admin User' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', fullName: 'Employee User' }
];

let jobs = [];
let jobId = 1;

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = users.find(u => u.id === req.session.userId);
  next();
};

// Routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    req.session.userId = user.id;
    res.json({ ...user, password: undefined });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ ...req.user, password: undefined });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.post('/api/jobs', requireAuth, (req, res) => {
  const jobData = req.body.job || req.body;
  
  const newJob = {
    id: jobId++,
    title: jobData.title,
    department: jobData.department,
    shortDescription: jobData.shortDescription || '',
    requirements: jobData.requirements || '',
    type: jobData.type || 'full-time',
    location: jobData.location || 'remote',
    employeeId: req.user.id,
    postedDate: new Date().toISOString()
  };
  
  jobs.push(newJob);
  res.status(201).json(newJob);
});

app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Engineering' },
    { id: 2, name: 'Marketing' },
    { id: 3, name: 'Sales' },
    { id: 4, name: 'HR' }
  ]);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    jobs: jobs.length,
    timestamp: new Date().toISOString()
  });
});

// Frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Career Portal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px 0; margin-bottom: 20px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin: 15px 0; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; background: #2563eb; color: white; }
        .btn:hover { background: #1d4ed8; }
        .btn-success { background: #16a34a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .job { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .hidden { display: none; }
        .flex { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>Career Portal - Working</h1>
        </div>
    </div>
    
    <div class="container">
        <div id="loginSection">
            <div class="card">
                <h2>Login to Career Portal</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <input type="text" id="username" placeholder="Username (employee)" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="password" placeholder="Password (employee123)" required>
                    </div>
                    <button type="submit" class="btn">Login</button>
                </form>
                <p style="margin-top: 15px; color: #666;">Test accounts: employee/employee123 or admin/admin123</p>
            </div>
        </div>

        <div id="dashboardSection" class="hidden">
            <div class="card">
                <div class="flex">
                    <h2 id="welcomeText">Welcome</h2>
                    <button onclick="logout()" class="btn">Logout</button>
                </div>
            </div>

            <div class="card">
                <h3>Create New Job</h3>
                <form id="jobForm">
                    <div class="grid">
                        <div class="form-group">
                            <input name="title" placeholder="Job Title" required>
                        </div>
                        <div class="form-group">
                            <input name="department" placeholder="Department" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea name="shortDescription" placeholder="Job Description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <textarea name="requirements" placeholder="Requirements" rows="3"></textarea>
                    </div>
                    <div class="grid">
                        <div class="form-group">
                            <select name="type">
                                <option value="full-time">Full Time</option>
                                <option value="part-time">Part Time</option>
                                <option value="contract">Contract</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <input name="location" placeholder="Location" value="remote">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success">Create Job</button>
                </form>
            </div>

            <div class="card">
                <h3>Jobs (<span id="jobCount">0</span>)</h3>
                <div id="jobsList">
                    <p>No jobs posted yet. Create your first job above!</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let user = null;
        let jobs = [];

        async function login(e) {
            e.preventDefault();
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
                    user = await response.json();
                    showDashboard();
                    loadJobs();
                } else {
                    alert('Login failed');
                }
            } catch (e) {
                alert('Login error: ' + e.message);
            }
        }

        async function createJob(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const jobData = {
                title: formData.get('title'),
                department: formData.get('department'),
                shortDescription: formData.get('shortDescription'),
                requirements: formData.get('requirements'),
                type: formData.get('type'),
                location: formData.get('location')
            };

            try {
                const response = await fetch('/api/jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ job: jobData })
                });

                if (response.ok) {
                    const newJob = await response.json();
                    jobs.push(newJob);
                    updateJobsList();
                    e.target.reset();
                    alert('Job created successfully!');
                } else {
                    alert('Failed to create job');
                }
            } catch (e) {
                alert('Error creating job: ' + e.message);
            }
        }

        async function loadJobs() {
            try {
                const response = await fetch('/api/jobs', { credentials: 'include' });
                jobs = await response.json();
                updateJobsList();
            } catch (e) {
                console.error('Failed to load jobs');
            }
        }

        function showDashboard() {
            document.getElementById('loginSection').classList.add('hidden');
            document.getElementById('dashboardSection').classList.remove('hidden');
            document.getElementById('welcomeText').textContent = 'Welcome, ' + user.fullName;
        }

        function updateJobsList() {
            const count = document.getElementById('jobCount');
            const list = document.getElementById('jobsList');
            
            count.textContent = jobs.length;
            
            if (jobs.length === 0) {
                list.innerHTML = '<p>No jobs posted yet. Create your first job above!</p>';
            } else {
                list.innerHTML = jobs.map(job => 
                    '<div class="job">' +
                    '<h4>' + job.title + '</h4>' +
                    '<p><strong>Department:</strong> ' + job.department + ' • <strong>Type:</strong> ' + job.type + ' • <strong>Location:</strong> ' + job.location + '</p>' +
                    '<p>' + job.shortDescription + '</p>' +
                    '<p><strong>Requirements:</strong> ' + job.requirements + '</p>' +
                    '<p style="font-size: 12px; color: #999;">Posted: ' + new Date(job.postedDate).toLocaleDateString() + '</p>' +
                    '</div>'
                ).join('');
            }
        }

        function logout() {
            fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            user = null;
            jobs = [];
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('loginForm').reset();
        }

        document.getElementById('loginForm').addEventListener('submit', login);
        document.getElementById('jobForm').addEventListener('submit', createJob);
    </script>
</body>
</html>`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=== Career Portal Working ===');
  console.log('Server: http://64.225.6.33:8080');
  console.log('Accounts: employee/employee123, admin/admin123');
  console.log('============================');
});