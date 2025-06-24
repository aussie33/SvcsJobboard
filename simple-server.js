const http = require('http');
const url = require('url');
const querystring = require('querystring');

const PORT = 8080;
let sessions = {};
let jobs = [];
let jobId = 1;

const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', fullName: 'Admin User' },
  { id: 2, username: 'employee', password: 'employee123', role: 'employee', fullName: 'Employee User' }
];

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse cookies for session
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      cookies[parts[0]] = parts[1];
    });
  }

  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    try {
      // Routes
      if (path === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          jobs: jobs.length,
          timestamp: new Date().toISOString(),
          server: 'Simple Node Server'
        }));
        return;
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const data = JSON.parse(body);
        const user = users.find(u => u.username === data.username && u.password === data.password);
        
        if (user) {
          const sessionId = generateSessionId();
          sessions[sessionId] = { userId: user.id, user };
          
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Max-Age=86400`
          });
          res.end(JSON.stringify({ ...user, password: undefined }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid credentials' }));
        }
        return;
      }

      if (path === '/api/jobs' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jobs));
        return;
      }

      if (path === '/api/jobs' && method === 'POST') {
        const sessionId = cookies.sessionId;
        const session = sessions[sessionId];
        
        if (!session) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        const data = JSON.parse(body);
        const jobData = data.job || data;
        
        const newJob = {
          id: jobId++,
          title: jobData.title,
          department: jobData.department,
          shortDescription: jobData.shortDescription || '',
          requirements: jobData.requirements || '',
          type: jobData.type || 'full-time',
          location: jobData.location || 'remote',
          employeeId: session.userId,
          postedDate: new Date().toISOString()
        };
        
        jobs.push(newJob);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newJob));
        return;
      }

      // Frontend
      if (path === '/' || !path.startsWith('/api/')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>Career Portal - Working</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px 0; text-align: center; margin-bottom: 20px; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .form-group { margin: 15px 0; }
        input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .btn { padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; background: #2563eb; color: white; width: 100%; }
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
        <h1>Career Portal - Deployed Successfully</h1>
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
                <p style="margin-top: 15px; color: #666; text-align: center;">
                    Test accounts:<br>
                    <strong>employee / employee123</strong><br>
                    <strong>admin / admin123</strong>
                </p>
            </div>
        </div>

        <div id="dashboardSection" class="hidden">
            <div class="card">
                <div class="flex">
                    <h2 id="welcomeText">Welcome</h2>
                    <button onclick="logout()" class="btn" style="width: auto;">Logout</button>
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
                                <option value="internship">Internship</option>
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
                    alert('Login failed - check your credentials');
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
                    const error = await response.json();
                    alert('Failed to create job: ' + (error.error || 'Unknown error'));
                }
            } catch (e) {
                alert('Error creating job: ' + e.message);
            }
        }

        async function loadJobs() {
            try {
                const response = await fetch('/api/jobs');
                jobs = await response.json();
                updateJobsList();
            } catch (e) {
                console.error('Failed to load jobs', e);
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
                    '<p style="color: #666;"><strong>Department:</strong> ' + job.department + ' • <strong>Type:</strong> ' + job.type + ' • <strong>Location:</strong> ' + job.location + '</p>' +
                    '<p>' + (job.shortDescription || '') + '</p>' +
                    '<p style="color: #777;"><strong>Requirements:</strong> ' + (job.requirements || '') + '</p>' +
                    '<p style="font-size: 12px; color: #999;">Posted: ' + new Date(job.postedDate).toLocaleDateString() + '</p>' +
                    '</div>'
                ).join('');
            }
        }

        function logout() {
            user = null;
            jobs = [];
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('dashboardSection').classList.add('hidden');
            document.getElementById('loginForm').reset();
        }

        document.getElementById('loginForm').addEventListener('submit', login);
        document.getElementById('jobForm').addEventListener('submit', createJob);
        
        // Load jobs on page load
        loadJobs();
    </script>
</body>
</html>`);
        return;
      }

      // 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));

    } catch (error) {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('=== Simple Career Portal Server ===');
  console.log(`Server running on http://64.225.6.33:${PORT}`);
  console.log('Accounts: employee/employee123, admin/admin123');
  console.log('===================================');
});