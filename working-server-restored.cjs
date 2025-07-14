const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

// In-memory storage for jobs and categories
let jobs = [
    {
        id: 1,
        title: "Software Engineer",
        company: "Tech Solutions Inc.",
        description: "Join our dynamic team to build innovative software solutions. Work with cutting-edge technologies and collaborate with talented developers.",
        type: "Full Time",
        location: "Remote",
        salary: "$80,000 - $120,000",
        category: "Technology"
    },
    {
        id: 2,
        title: "Marketing Manager", 
        company: "Creative Agency",
        description: "Lead marketing campaigns and drive brand awareness. Perfect opportunity for a creative professional to make an impact.",
        type: "Full Time",
        location: "New York, NY",
        salary: "$60,000 - $80,000",
        category: "Marketing"
    },
    {
        id: 3,
        title: "UX Designer",
        company: "Design Studio", 
        description: "Create beautiful and intuitive user experiences. Work with cross-functional teams to deliver exceptional digital products.",
        type: "Contract",
        location: "San Francisco, CA",
        salary: "$70,000 - $90,000",
        category: "Design"
    },
    {
        id: 4,
        title: "Data Analyst",
        company: "Analytics Corp",
        description: "Analyze complex data sets to drive business insights. Work with modern analytics tools and present findings to stakeholders.",
        type: "Full Time", 
        location: "Chicago, IL",
        salary: "$65,000 - $85,000",
        category: "Analytics"
    },
    {
        id: 5,
        title: "Product Manager",
        company: "Innovation Labs",
        description: "Lead product development from conception to launch. Collaborate with engineering and design teams to build amazing products.",
        type: "Full Time",
        location: "Seattle, WA", 
        salary: "$90,000 - $130,000",
        category: "Product"
    },
    {
        id: 6,
        title: "Sales Representative",
        company: "Sales Solutions",
        description: "Drive revenue growth through client relationships and strategic sales initiatives. Excellent commission structure.",
        type: "Full Time",
        location: "Miami, FL",
        salary: "$50,000 - $120,000",
        category: "Sales"
    }
];

let categories = [
    { id: 1, name: "Technology", description: "Software development and IT roles" },
    { id: 2, name: "Marketing", description: "Marketing and communications positions" },
    { id: 3, name: "Design", description: "Creative and design roles" },
    { id: 4, name: "Analytics", description: "Data analysis and business intelligence" },
    { id: 5, name: "Product", description: "Product management and strategy" },
    { id: 6, name: "Sales", description: "Sales and business development" }
];

// Simple session storage
let sessions = {};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API Routes
    if (pathname === '/api/jobs' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jobs));
        return;
    }
    
    if (pathname === '/api/categories' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(categories));
        return;
    }
    
    if (pathname === '/api/categories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const newCategory = JSON.parse(body);
                const category = {
                    id: categories.length + 1,
                    name: newCategory.name,
                    description: newCategory.description || ''
                };
                categories.push(category);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(category));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // Main pages
    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getHomePage());
        return;
    }
    
    if (pathname === '/admin') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getAdminPage());
        return;
    }
    
    if (pathname === '/employee') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getEmployeePage());
        return;
    }
    
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

function getHomePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Resource Consultants - Career Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        
        .header { background: white; padding: 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
        .logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .logo img { width: 32px; height: 32px; }
        .logo h1 { font-size: 24px; color: #9333ea; font-weight: 700; }
        .nav { display: flex; gap: 24px; align-items: center; }
        .nav-link { color: #666; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 4px; transition: all 0.3s; }
        .nav-link:hover { color: #9333ea; background: #f3f4f6; }
        .nav-link.active { color: #9333ea; background: #f3f4f6; }
        .login-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
        .login-btn:hover { background: #7c3aed; }
        
        .hero { background: linear-gradient(135deg, #9333ea 0%, #8e24aa 100%); color: white; padding: 80px 24px; text-align: center; }
        .hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; }
        .hero p { font-size: 20px; margin-bottom: 32px; opacity: 0.9; }
        .btn-primary { background: white; color: #9333ea; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
        .section-title { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 32px; text-align: center; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin-top: 32px; }
        .job-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; }
        .job-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .job-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 8px; }
        .job-company { color: #9333ea; font-weight: 500; margin-bottom: 12px; }
        .job-description { color: #6b7280; margin-bottom: 16px; line-height: 1.6; }
        .job-badges { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .badge-type { background: #dbeafe; color: #1e40af; }
        .badge-location { background: #d1fae5; color: #047857; }
        .apply-btn { background: #9333ea; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%; transition: background 0.3s; }
        .apply-btn:hover { background: #7c3aed; }
        
        /* Modal Styles */
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: white; margin: 5% auto; padding: 0; width: 90%; max-width: 500px; border-radius: 12px; position: relative; }
        .modal-header { background: linear-gradient(135deg, #9333ea 0%, #8e24aa 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; }
        .modal-header h3 { margin: 0; font-size: 24px; font-weight: 600; }
        .close { color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer; position: absolute; right: 20px; top: 20px; }
        .close:hover { opacity: 0.7; }
        .modal-body { padding: 24px; }
        .modal-logo { text-align: center; margin-bottom: 20px; }
        .modal-logo img { width: 48px; height: 48px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #374151; }
        .form-group input { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; }
        .form-group input:focus { outline: none; border-color: #9333ea; }
        .modal-footer { padding: 0 24px 24px; display: flex; gap: 12px; justify-content: flex-end; }
        .btn-cancel { background: #f3f4f6; color: #374151; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal { background: #9333ea; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal:hover { background: #7c3aed; }
        
        @media (max-width: 768px) {
            .jobs-grid { grid-template-columns: 1fr; }
            .hero h1 { font-size: 32px; }
            .hero p { font-size: 16px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo" onclick="navigateToHome()">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzkzMzNlYSIvPgo8dGV4dCB4PSIyMCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQzwvdGV4dD4KPC9zdmc+" alt="RC Logo">
                <h1>The Resource Consultants</h1>
            </div>
            <nav class="nav">
                <a href="/" class="nav-link active">Job Listings</a>
                <button class="login-btn" onclick="showLogin()">Login</button>
            </nav>
        </div>
    </div>

    <div class="hero">
        <h1>Find Your Dream Career</h1>
        <p>Connect with top employers and discover opportunities that match your skills</p>
        <button class="btn-primary" onclick="scrollToJobs()">Browse Jobs</button>
    </div>
    
    <div class="container">
        <h2 class="section-title">Explore Job Opportunities</h2>
        <div class="jobs-grid" id="jobsGrid">
            <!-- Jobs will be populated here -->
        </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close" onclick="closeLogin()">&times;</span>
                <div class="modal-logo">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0id2hpdGUiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjOTMzM2VhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQzwvdGV4dD4KPHN2Zz4=" alt="RC Logo">
                </div>
                <h3>Welcome to The Resource Consultants</h3>
            </div>
            <div class="modal-body">
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password:</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeLogin()">Cancel</button>
                <button type="button" class="btn-primary-modal" onclick="login()">Login</button>
            </div>
        </div>
    </div>
    
    <script>
        // Load jobs on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadJobs();
        });
        
        function loadJobs() {
            fetch('/api/jobs')
                .then(response => response.json())
                .then(jobs => {
                    const jobsGrid = document.getElementById('jobsGrid');
                    jobsGrid.innerHTML = jobs.map(job => 
                        '<div class="job-card">' +
                            '<div class="job-title">' + job.title + '</div>' +
                            '<div class="job-company">' + job.company + '</div>' +
                            '<div class="job-description">' + job.description + '</div>' +
                            '<div class="job-badges">' +
                                '<span class="badge badge-type">' + job.type + '</span>' +
                                '<span class="badge badge-location">' + job.location + '</span>' +
                            '</div>' +
                            '<button class="apply-btn" onclick="applyToJob(\'' + job.title + '\')">Apply Now</button>' +
                        '</div>'
                    ).join('');
                })
                .catch(error => {
                    console.error('Error loading jobs:', error);
                    // Fallback to display some jobs
                    const jobsGrid = document.getElementById('jobsGrid');
                    jobsGrid.innerHTML = 
                        '<div class="job-card">' +
                            '<div class="job-title">Software Engineer</div>' +
                            '<div class="job-company">Tech Solutions Inc.</div>' +
                            '<div class="job-description">Join our dynamic team to build innovative software solutions.</div>' +
                            '<div class="job-badges">' +
                                '<span class="badge badge-type">Full Time</span>' +
                                '<span class="badge badge-location">Remote</span>' +
                            '</div>' +
                            '<button class="apply-btn" onclick="applyToJob(\'Software Engineer\')">Apply Now</button>' +
                        '</div>' +
                        '<div class="job-card">' +
                            '<div class="job-title">Marketing Manager</div>' +
                            '<div class="job-company">Creative Agency</div>' +
                            '<div class="job-description">Lead marketing campaigns and drive brand awareness.</div>' +
                            '<div class="job-badges">' +
                                '<span class="badge badge-type">Full Time</span>' +
                                '<span class="badge badge-location">New York, NY</span>' +
                            '</div>' +
                            '<button class="apply-btn" onclick="applyToJob(\'Marketing Manager\')">Apply Now</button>' +
                        '</div>' +
                        '<div class="job-card">' +
                            '<div class="job-title">UX Designer</div>' +
                            '<div class="job-company">Design Studio</div>' +
                            '<div class="job-description">Create beautiful and intuitive user experiences.</div>' +
                            '<div class="job-badges">' +
                                '<span class="badge badge-type">Contract</span>' +
                                '<span class="badge badge-location">San Francisco, CA</span>' +
                            '</div>' +
                            '<button class="apply-btn" onclick="applyToJob(\'UX Designer\')">Apply Now</button>' +
                        '</div>';
                });
        }
        
        function navigateToHome() {
            window.location.href = '/';
        }
        
        function showLogin() {
            document.getElementById('loginModal').style.display = 'flex';
        }
        
        function closeLogin() {
            document.getElementById('loginModal').style.display = 'none';
        }
        
        function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }
            
            // Mock authentication
            if (username === 'admin' && password === 'admin') {
                alert('Login successful! Redirecting to Admin Portal...');
                window.location.href = '/admin';
            } else if (username === 'employee' && password === 'employee') {
                alert('Login successful! Redirecting to Employee Portal...');
                window.location.href = '/employee';
            } else {
                alert('Invalid username or password');
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('loginModal');
            if (event.target === modal) {
                closeLogin();
            }
        }
        
        function scrollToJobs() {
            document.getElementById('jobsGrid').scrollIntoView({ behavior: 'smooth' });
        }
        
        function applyToJob(jobTitle) {
            alert('Apply to ' + jobTitle + ' - redirect to application form');
        }
    </script>
</body>
</html>`;
}

function getAdminPage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - The Resource Consultants</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        
        .header { background: white; padding: 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
        .logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .logo img { width: 32px; height: 32px; }
        .logo h1 { font-size: 24px; color: #9333ea; font-weight: 700; }
        .nav { display: flex; gap: 24px; align-items: center; }
        .nav-link { color: #666; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 4px; transition: all 0.3s; }
        .nav-link:hover { color: #9333ea; background: #f3f4f6; }
        .nav-link.active { color: #9333ea; background: #f3f4f6; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
        .page-title { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 32px; }
        .tabs { display: flex; gap: 0; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; }
        .tab { padding: 12px 24px; background: none; border: none; cursor: pointer; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; }
        .tab.active { color: #9333ea; border-bottom-color: #9333ea; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .add-btn { background: #9333ea; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-bottom: 20px; }
        .add-btn:hover { background: #7c3aed; }
        
        .table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .table th, .table td { padding: 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .table th { background: #f8f9fa; font-weight: 600; color: #374151; }
        
        /* Modal Styles */
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: white; margin: 5% auto; padding: 0; width: 90%; max-width: 500px; border-radius: 8px; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-header h3 { margin: 0; font-size: 20px; font-weight: 600; }
        .close { color: #6b7280; float: right; font-size: 24px; font-weight: bold; cursor: pointer; }
        .close:hover { color: #374151; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #374151; }
        .form-group input, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px; }
        .form-group textarea { resize: vertical; min-height: 80px; }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #9333ea; }
        .modal-footer { padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; }
        .btn-cancel { background: #f3f4f6; color: #374151; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal:hover { background: #7c3aed; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo" onclick="navigateToHome()">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzkzMzNlYSIvPgo8dGV4dCB4PSIyMCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQzwvdGV4dD4KPC9zdmc+" alt="RC Logo">
                <h1>The Resource Consultants</h1>
            </div>
            <nav class="nav">
                <a href="/" class="nav-link">Job Listings</a>
                <a href="/employee" class="nav-link">Employee Portal</a>
                <a href="/admin" class="nav-link active">Admin Portal</a>
            </nav>
        </div>
    </div>

    <div class="container">
        <h1 class="page-title">Admin Portal</h1>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('categories')">Job Categories</button>
            <button class="tab" onclick="showTab('users')">User Management</button>
        </div>
        
        <div id="categories" class="tab-content active">
            <button class="add-btn" onclick="showAddCategoryModal()">Add New Category</button>
            <table class="table">
                <thead>
                    <tr>
                        <th>Category Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="categoriesTableBody">
                    <!-- Categories will be populated here -->
                </tbody>
            </table>
        </div>
        
        <div id="users" class="tab-content">
            <table class="table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>admin</td>
                        <td>Administrator</td>
                        <td>Active</td>
                        <td>Edit | Delete</td>
                    </tr>
                    <tr>
                        <td>employee</td>
                        <td>Employee</td>
                        <td>Active</td>
                        <td>Edit | Delete</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Add Category Modal -->
    <div id="addCategoryModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New Category</h3>
                <span class="close" onclick="closeAddCategoryModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="addCategoryForm">
                    <div class="form-group">
                        <label for="categoryName">Category Name:</label>
                        <input type="text" id="categoryName" name="categoryName" required>
                    </div>
                    <div class="form-group">
                        <label for="categoryDescription">Description:</label>
                        <textarea id="categoryDescription" name="categoryDescription"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeAddCategoryModal()">Cancel</button>
                <button type="button" class="btn-primary-modal" onclick="addCategory()">Add Category</button>
            </div>
        </div>
    </div>
    
    <script>
        // Load categories on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadCategories();
        });
        
        function loadCategories() {
            fetch('/api/categories')
                .then(response => response.json())
                .then(categories => {
                    const tableBody = document.getElementById('categoriesTableBody');
                    tableBody.innerHTML = categories.map(category => 
                        '<tr>' +
                            '<td>' + category.name + '</td>' +
                            '<td>' + category.description + '</td>' +
                            '<td>Edit | Delete</td>' +
                        '</tr>'
                    ).join('');
                })
                .catch(error => {
                    console.error('Error loading categories:', error);
                });
        }
        
        function showTab(tabName) {
            // Hide all tabs
            const tabs = document.querySelectorAll('.tab-content');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            const tabButtons = document.querySelectorAll('.tab');
            tabButtons.forEach(button => button.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }
        
        function showAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'flex';
        }
        
        function closeAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'none';
            document.getElementById('addCategoryForm').reset();
        }
        
        function addCategory() {
            const name = document.getElementById('categoryName').value;
            const description = document.getElementById('categoryDescription').value;
            
            if (!name.trim()) {
                alert('Please enter a category name');
                return;
            }
            
            fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, description })
            })
            .then(response => response.json())
            .then(data => {
                closeAddCategoryModal();
                loadCategories(); // Refresh the table
                alert('Category added successfully!');
            })
            .catch(error => {
                console.error('Error adding category:', error);
                alert('Error adding category. Please try again.');
            });
        }
        
        function navigateToHome() {
            window.location.href = '/';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('addCategoryModal');
            if (event.target === modal) {
                closeAddCategoryModal();
            }
        }
    </script>
</body>
</html>`;
}

function getEmployeePage() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Portal - The Resource Consultants</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        
        .header { background: white; padding: 16px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
        .logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .logo img { width: 32px; height: 32px; }
        .logo h1 { font-size: 24px; color: #9333ea; font-weight: 700; }
        .nav { display: flex; gap: 24px; align-items: center; }
        .nav-link { color: #666; text-decoration: none; font-weight: 500; padding: 8px 16px; border-radius: 4px; transition: all 0.3s; }
        .nav-link:hover { color: #9333ea; background: #f3f4f6; }
        .nav-link.active { color: #9333ea; background: #f3f4f6; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
        .page-title { font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 32px; }
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .dashboard-card { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .dashboard-card h3 { color: #9333ea; margin-bottom: 16px; font-size: 20px; }
        .dashboard-card p { color: #6b7280; margin-bottom: 16px; }
        .dashboard-card .stat { font-size: 32px; font-weight: 700; color: #111827; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo" onclick="navigateToHome()">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzkzMzNlYSIvPgo8dGV4dCB4PSIyMCIgeT0iMjgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SQzwvdGV4dD4KPC9zdmc+" alt="RC Logo">
                <h1>The Resource Consultants</h1>
            </div>
            <nav class="nav">
                <a href="/" class="nav-link">Job Listings</a>
                <a href="/employee" class="nav-link active">Employee Portal</a>
                <a href="/admin" class="nav-link">Admin Portal</a>
            </nav>
        </div>
    </div>

    <div class="container">
        <h1 class="page-title">Employee Portal</h1>
        
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Total Jobs</h3>
                <p>Active job postings</p>
                <div class="stat">6</div>
            </div>
            <div class="dashboard-card">
                <h3>Applications</h3>
                <p>Total applications received</p>
                <div class="stat">42</div>
            </div>
            <div class="dashboard-card">
                <h3>Pending Review</h3>
                <p>Applications waiting for review</p>
                <div class="stat">12</div>
            </div>
        </div>
    </div>
    
    <script>
        function navigateToHome() {
            window.location.href = '/';
        }
    </script>
</body>
</html>`;
}

const PORT = process.env.PORT || 80;
server.listen(PORT, () => {
    console.log(`🚀 Career Portal server running on port ${PORT}`);
    console.log(`🌐 Access at: http://64.225.6.33/`);
});