const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 80;

// In-memory data storage
let categories = [
    { id: 1, name: 'Administrative', description: 'Administrative and office support roles', status: 'active' },
    { id: 2, name: 'Technology', description: 'Software development and IT positions', status: 'active' },
    { id: 3, name: 'Marketing', description: 'Marketing and communications roles', status: 'active' }
];

let jobs = [
    {
        id: 1,
        title: "Software Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full Time",
        category: "Technology",
        salary: "$80,000 - $120,000",
        description: "We are looking for a skilled Software Engineer to join our dynamic team...",
        posted: "2 days ago"
    },
    {
        id: 2,
        title: "Marketing Manager",
        department: "Marketing",
        location: "New York, NY",
        type: "Full Time",
        category: "Marketing",
        salary: "$60,000 - $80,000",
        description: "Lead our marketing initiatives and drive brand awareness...",
        posted: "1 week ago"
    },
    {
        id: 3,
        title: "Administrative Assistant",
        department: "Administration",
        location: "Boston, MA",
        type: "Full Time",
        category: "Administrative",
        salary: "$35,000 - $45,000",
        description: "Support our team with administrative tasks and office management...",
        posted: "3 days ago"
    }
];

// Main Career Portal HTML
const mainHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Resource Consultants - Career Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; }
        .job-card { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            background: white; 
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .job-card:hover { 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
        }
        .job-title { 
            color: #3b82f6; 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 8px;
        }
        .job-description { 
            color: #6b7280; 
            font-size: 14px; 
            margin-bottom: 16px;
        }
        .job-details { 
            display: flex; 
            gap: 20px; 
            margin-bottom: 16px; 
            color: #6b7280; 
            font-size: 14px;
        }
        .job-type-badge { 
            background: #9333ea; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 16px; 
            font-size: 12px; 
            font-weight: 500;
        }
        .location-badge { 
            background: #10b981; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 16px; 
            font-size: 12px; 
            font-weight: 500;
        }
        .apply-btn { 
            background: #9333ea; 
            color: white; 
            padding: 8px 16px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: 500;
        }
        .apply-btn:hover { 
            background: #7c3aed; 
        }
        .login-btn { 
            background: #9333ea; 
            color: white; 
            padding: 8px 16px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: 500;
        }
        .login-btn:hover { 
            background: #7c3aed; 
        }
        .filter-section { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
        }
        .checkbox-list { 
            display: flex; 
            flex-direction: column; 
            gap: 8px;
        }
        .checkbox-item { 
            display: flex; 
            align-items: center; 
            gap: 8px;
        }
        .modal { 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.5); 
            display: none; 
            align-items: center; 
            justify-content: center; 
            z-index: 1000;
        }
        .modal-content { 
            background: white; 
            border-radius: 8px; 
            width: 90%; 
            max-width: 400px; 
            overflow: hidden;
        }
        .modal-header { 
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); 
            color: white; 
            padding: 20px; 
            text-align: center;
        }
        .modal-body { 
            padding: 20px;
        }
        .form-group { 
            margin-bottom: 16px;
        }
        .form-group label { 
            display: block; 
            margin-bottom: 4px; 
            font-weight: 500;
        }
        .form-group input, .form-group textarea { 
            width: 100%; 
            padding: 8px 12px; 
            border: 1px solid #d1d5db; 
            border-radius: 6px; 
            font-size: 14px;
        }
        .form-group input:focus, .form-group textarea:focus { 
            outline: none; 
            border-color: #9333ea;
        }
        .account-type-btn { 
            background: #f3f4f6; 
            color: #6b7280; 
            padding: 8px 16px; 
            border-radius: 20px; 
            border: none; 
            cursor: pointer; 
            font-size: 14px; 
            font-weight: 500;
        }
        .account-type-btn.active { 
            background: #9333ea; 
            color: white;
        }
        .close { 
            color: white; 
            font-size: 24px; 
            cursor: pointer; 
            position: absolute; 
            right: 20px; 
            top: 20px;
        }
        .notification { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #10b981; 
            color: white; 
            padding: 12px 20px; 
            border-radius: 6px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            z-index: 1001;

            <h1 class="text-4xl md:text-6xl font-bold mb-6">Find Your Dream Career</h1>
            <p class="text-xl md:text-2xl mb-8 text-purple-100">
                Discover exciting opportunities with The Resource Consultants
            </p>
            <div class="max-w-2xl mx-auto">
                <div class="relative">
                    <input type="text" placeholder="Search jobs, companies, or keywords" 
                           class="w-full px-6 py-4 text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <button class="absolute right-2 top-2 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700">
                        Search
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <!-- Filters Sidebar -->
            <div class="lg:col-span-1">
                <div class="filter-section">
                    <h3 class="text-lg font-semibold mb-4">Filter Jobs</h3>
                    
                    <div class="mb-6">
                        <h4 class="font-medium mb-3">Categories</h4>
                        <div class="checkbox-list">
                            <div class="checkbox-item">
                                <input type="checkbox" id="administrative" class="rounded">
                                <label for="administrative">Administrative</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="technology" class="rounded">
                                <label for="technology">Technology</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="marketing" class="rounded">
                                <label for="marketing">Marketing</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-medium mb-3">Location</h4>
                        <div class="checkbox-list">
                            <div class="checkbox-item">
                                <input type="checkbox" id="remote" class="rounded">
                                <label for="remote">Remote</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="newyork" class="rounded">
                                <label for="newyork">New York</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="boston" class="rounded">
                                <label for="boston">Boston</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <h4 class="font-medium mb-3">Job Type</h4>
                        <div class="checkbox-list">
                            <div class="checkbox-item">
                                <input type="checkbox" id="fulltime" class="rounded">
                                <label for="fulltime">Full Time</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="parttime" class="rounded">
                                <label for="parttime">Part Time</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="contract" class="rounded">
                                <label for="contract">Contract</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Job Listings -->
            <div class="lg:col-span-3">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Explore Job Opportunities</h2>
                    <p class="text-gray-600">Find your next career move with our curated job listings</p>
                </div>
                
                <div id="jobListings">
                    <!-- Jobs will be populated here -->
                </div>
            </div>
        </div>
    </main>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close login-close">&times;</span>
                <div class="text-center">
                    <div class="mb-4">
                        <span class="text-3xl font-bold">RC</span>
                    </div>
                    <p class="text-sm text-white/90">Please login or sign up to continue using our app</p>
                </div>
            </div>
            
            <!-- Account type selector -->
            <div class="bg-gray-100 px-6 py-4">
                <div class="flex flex-wrap justify-center gap-2">
                    <button type="button" class="account-type-btn active" data-role="applicant">
                        Applicant
                    </button>
                    <button type="button" class="account-type-btn" data-role="employee">
                        Employee
                    </button>
                    <button type="button" class="account-type-btn" data-role="admin">
                        Admin
                    </button>
                </div>
            </div>
            
            <!-- Login form -->
            <div class="modal-body">
                <form id="loginForm">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="usernameInput" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="passwordInput" required>
                    </div>
                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg mb-4">
                        Login
                    </button>
                    
                    <!-- Demo accounts -->
                    <div class="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p class="font-medium mb-1">Demo accounts:</p>
                        <p><strong>Admin:</strong> admin / admin123</p>
                        <p><strong>Employee:</strong> employee / employee123</p>
                        <p><strong>Applicant:</strong> applicant / applicant123</p>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Application Modal -->
    <div id="applicationModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close application-close">&times;</span>
                <div class="text-center">
                    <h3 class="text-lg font-semibold">Apply for Position</h3>
                </div>
            </div>
            <div class="modal-body">
                <form id="applicationForm">
                    <div class="form-group">
                        <label>Full Name*</label>
                        <input type="text" name="fullName" required>
                    </div>
                    <div class="form-group">
                        <label>Email*</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone">
                    </div>
                    <div class="form-group">
                        <label>Cover Letter</label>
                        <textarea name="coverLetter" rows="4" placeholder="Tell us why you're interested in this position..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Resume</label>
                        <input type="file" name="resume" accept=".pdf,.doc,.docx">
                    </div>
                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg">
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Load jobs on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadJobs();
        });

        // Modal functionality
        const loginModal = document.getElementById('loginModal');
        const applicationModal = document.getElementById('applicationModal');
        const loginBtn = document.getElementById('loginBtn');
        const loginClose = document.querySelector('.login-close');
        const applicationClose = document.querySelector('.application-close');

        loginBtn.onclick = function() {
            loginModal.style.display = 'flex';
        }

        loginClose.onclick = function() {
            loginModal.style.display = 'none';
        }

        applicationClose.onclick = function() {
            applicationModal.style.display = 'none';
        }

        window.onclick = function(event) {
            if (event.target == loginModal) {
                loginModal.style.display = 'none';
            }
            if (event.target == applicationModal) {
                applicationModal.style.display = 'none';
            }
        }

        // Account type selector
        const accountTypeBtns = document.querySelectorAll('.account-type-btn');
        let selectedRole = 'applicant';
        
        accountTypeBtns.forEach(btn => {
            btn.onclick = function() {
                accountTypeBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedRole = this.dataset.role;
            };
        });

        // Login form
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();
            const username = document.getElementById('usernameInput').value;
            const password = document.getElementById('passwordInput').value;
            
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    role: selectedRole
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Login successful! Welcome ' + data.user.firstName + '!');
                    loginModal.style.display = 'none';
                    
                    if (data.user.role === 'admin') {
                        document.getElementById('loginBtn').textContent = 'Admin Portal';
                        document.getElementById('loginBtn').onclick = function() {
                            window.location.href = '/admin';
                        };
                    } else if (data.user.role === 'employee') {
                        document.getElementById('loginBtn').textContent = 'Employee Portal';
                    } else {
                        document.getElementById('loginBtn').textContent = 'My Applications';
                    }
                } else {
                    showNotification('Login failed: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showNotification('Login error. Please try again.');
            });
        }

        // Application form
        document.getElementById('applicationForm').onsubmit = function(e) {
            e.preventDefault();
            showNotification('Application submitted successfully! We will review your application and get back to you soon.');
            applicationModal.style.display = 'none';
        }

        // Load jobs from API
        function loadJobs() {
            fetch('/api/jobs')
                .then(response => response.json())
                .then(jobs => {
                    const jobListings = document.getElementById('jobListings');
                    jobListings.innerHTML = '';
                    
                    jobs.forEach(job => {
                        const jobCard = document.createElement('div');
                        jobCard.className = 'job-card';
                        jobCard.innerHTML = \`
                            <div class="job-title">\${job.title}</div>
                            <div class="job-description">\${job.description}</div>
                            <div class="job-details">
                                <span>📍 \${job.location}</span>
                                <span>🏢 \${job.department}</span>
                                <span>💰 \${job.salary}</span>
                                <span>⏰ \${job.posted}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex gap-2">
                                    <span class="job-type-badge">\${job.type}</span>
                                    <span class="location-badge">\${job.category}</span>
                                </div>
                                <button class="apply-btn" onclick="openApplicationModal('\${job.id}')">Apply Now</button>
                            </div>
                        \`;
                        jobListings.appendChild(jobCard);
                    });
                })
                .catch(error => console.error('Error loading jobs:', error));
        }

        function openApplicationModal(jobId) {
            applicationModal.style.display = 'flex';
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 4000);
        }
    </script>
</body>
</html>
`;

// Employee Portal HTML
const employeeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Portal - The Resource Consultants</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
        
        .header { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
        .logo { display: flex; align-items: center; gap: 8px; color: #9333ea; font-weight: 600; }
        .nav-tabs { display: flex; gap: 32px; }
        .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; }
        .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
        .user-info { display: flex; align-items: center; gap: 16px; color: #6b7280; font-size: 14px; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .page-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 4px; }
        .page-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
        
        .section-tabs { display: flex; gap: 32px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
        .section-tab { padding: 12px 0; color: #6b7280; text-decoration: none; border-bottom: 2px solid transparent; cursor: pointer; }
        .section-tab.active { color: #111827; border-bottom-color: #9333ea; font-weight: 500; }
        
        .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 16px; font-weight: 600; color: #111827; }
        .add-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .add-btn:hover { background: #7c3aed; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 24px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8f9fa; font-weight: 500; color: #6b7280; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .action-btn { color: #6b7280; text-decoration: none; margin-right: 12px; }
        .action-btn:hover { color: #9333ea; }
        .action-btn.danger { color: #dc2626; }
        
        .section { display: none; }
        .section.active { display: block; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-number { font-size: 24px; font-weight: 600; color: #111827; }
        .stat-label { color: #6b7280; font-size: 14px; }
        .stat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .stat-icon.purple { background: #f3e8ff; color: #9333ea; }
        .stat-icon.green { background: #ecfdf5; color: #10b981; }
        .stat-icon.blue { background: #eff6ff; color: #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo">
                🏢 The Resource Consultants
            </div>
            <div class="nav-tabs">
                <a href="/" class="nav-tab">Job Listings</a>
                <a href="#" class="nav-tab active">Employee Portal</a>
                <a href="/admin" class="nav-tab">Admin Portal</a>
            </div>
            <div class="user-info">
                <span>Hello, Employee</span>
                <a href="/" class="logout-btn">Log off</a>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="page-header">
            <h1 class="page-title">Employee Portal</h1>
            <p class="page-subtitle">Manage job postings and review applications</p>
        </div>
        
        <!-- Stats Overview -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon purple">📄</div>
                <div class="stat-number">3</div>
                <div class="stat-label">Active Job Postings</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">👥</div>
                <div class="stat-number">12</div>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">📊</div>
                <div class="stat-number">8</div>
                <div class="stat-label">Applications This Week</div>
            </div>
        </div>
        
        <div class="section-tabs">
            <a href="#" class="section-tab active" onclick="showSection('jobs')">Job Postings</a>
            <a href="#" class="section-tab" onclick="showSection('applications')">Applications</a>
        </div>
        
        <div id="jobsSection" class="section active">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Job Postings</h2>
                    <button class="add-btn">Create New Job</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Department</th>
                            <th>Location</th>
                            <th>Applications</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="jobsTableBody">
                        <tr>
                            <td>Software Engineer</td>
                            <td>Engineering</td>
                            <td>Remote</td>
                            <td>5</td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>
                                <a href="#" class="action-btn">Edit</a>
                                <a href="#" class="action-btn">View Applications</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Marketing Manager</td>
                            <td>Marketing</td>
                            <td>New York, NY</td>
                            <td>4</td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>
                                <a href="#" class="action-btn">Edit</a>
                                <a href="#" class="action-btn">View Applications</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Administrative Assistant</td>
                            <td>Administration</td>
                            <td>Boston, MA</td>
                            <td>3</td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>
                                <a href="#" class="action-btn">Edit</a>
                                <a href="#" class="action-btn">View Applications</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="applicationsSection" class="section">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Applications</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Applicant Name</th>
                            <th>Job Title</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>John Smith</td>
                            <td>Software Engineer</td>
                            <td>2 days ago</td>
                            <td><span class="status-badge status-pending">Under Review</span></td>
                            <td>
                                <a href="#" class="action-btn">View Details</a>
                                <a href="#" class="action-btn">Download Resume</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Sarah Johnson</td>
                            <td>Marketing Manager</td>
                            <td>3 days ago</td>
                            <td><span class="status-badge status-pending">Under Review</span></td>
                            <td>
                                <a href="#" class="action-btn">View Details</a>
                                <a href="#" class="action-btn">Download Resume</a>
                            </td>
                        </tr>
                        <tr>
                            <td>Mike Davis</td>
                            <td>Administrative Assistant</td>
                            <td>1 week ago</td>
                            <td><span class="status-badge status-active">Shortlisted</span></td>
                            <td>
                                <a href="#" class="action-btn">View Details</a>
                                <a href="#" class="action-btn">Download Resume</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        function showSection(section) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById(section + 'Section').classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
`;

// Admin Portal HTML (from working-server.cjs)
const adminHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - The Resource Consultants</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
        
        .header { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
        .logo { display: flex; align-items: center; gap: 8px; color: #9333ea; font-weight: 600; }
        .nav-tabs { display: flex; gap: 32px; }
        .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; }
        .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
        .user-info { display: flex; align-items: center; gap: 16px; color: #6b7280; font-size: 14px; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .page-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 4px; }
        .page-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
        
        .section-tabs { display: flex; gap: 32px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
        .section-tab { padding: 12px 0; color: #6b7280; text-decoration: none; border-bottom: 2px solid transparent; cursor: pointer; }
        .section-tab.active { color: #111827; border-bottom-color: #9333ea; font-weight: 500; }
        
        .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
        .card-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 16px; font-weight: 600; color: #111827; }
        .add-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .add-btn:hover { background: #7c3aed; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 24px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8f9fa; font-weight: 500; color: #6b7280; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .status-active { background: #dcfce7; color: #166534; }
        .action-btn { color: #6b7280; text-decoration: none; margin-right: 12px; }
        .action-btn:hover { color: #9333ea; }
        .action-btn.danger { color: #dc2626; }
        
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 500px; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; color: #111827; font-size: 18px; font-weight: 600; }
        .close { color: #6b7280; font-size: 24px; cursor: pointer; }
        .close:hover { color: #111827; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #374151; }
        .form-group input, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-group input:focus, .form-group textarea:focus { outline: none; border-color: #9333ea; }
        .radio-group { display: flex; gap: 16px; }
        .radio-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .modal-footer { padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { background: #f3f4f6; color: #374151; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary:hover { background: #7c3aed; }
        
        .section { display: none; }
        .section.active { display: block; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo">
                🏢 The Resource Consultants
            </div>
            <div class="nav-tabs">
                <a href="/" class="nav-tab">Job Listings</a>
                <a href="/employee" class="nav-tab">Employee Portal</a>
                <a href="/admin" class="nav-tab active">Admin Portal</a>
            </div>
            <div class="user-info">
                <span>Hello, Admin</span>
                <a href="/" class="logout-btn">Log off</a>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="page-header">
            <h1 class="page-title">Admin Portal</h1>
            <p class="page-subtitle">Manage your recruitment system settings</p>
        </div>
        
        <div class="section-tabs">
            <a href="#" class="section-tab" onclick="showSection('users')">User Management</a>
            <a href="#" class="section-tab active" onclick="showSection('categories')">Job Categories</a>
        </div>
        
        <div id="usersSection" class="section">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">User Management</h2>
                    <button class="add-btn">Add New User</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>John Admin</td>
                            <td>admin@company.com</td>
                            <td>Administrator</td>
                            <td><span class="status-badge status-active">Active</span></td>
                            <td>
                                <a href="#" class="action-btn">Edit</a>
                                <a href="#" class="action-btn danger">Delete</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="categoriesSection" class="section active">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Job Categories</h2>
                    <button class="add-btn" onclick="openAddCategoryModal()">Add New Category</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Category Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="categoriesTableBody">
                        <!-- Categories will be populated here -->
                    </tbody>
                </table>
            </div>
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
                        <label>Category Name*</label>
                        <input type="text" name="name" placeholder="e.g. Engineering" required />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" placeholder="Brief description of this category" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="status" value="active" checked />
                                Active
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="status" value="inactive" />
                                Inactive
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-cancel" onclick="closeAddCategoryModal()">Cancel</button>
                <button type="button" class="btn-primary" onclick="submitAddCategory()">Add Category</button>
            </div>
        </div>
    </div>
    
    <script>
        // Load categories on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadCategories();
        });
        
        function showSection(section) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            
            document.getElementById(section + 'Section').classList.add('active');
            event.target.classList.add('active');
        }
        
        function loadCategories() {
            fetch('/api/categories')
                .then(response => response.json())
                .then(categories => {
                    const tbody = document.getElementById('categoriesTableBody');
                    tbody.innerHTML = '';
                    
                    categories.forEach(category => {
                        const row = document.createElement('tr');
                        row.innerHTML = 
                            '<td>' + category.name + '</td>' +
                            '<td>' + category.description + '</td>' +
                            '<td><span class="status-badge status-' + category.status + '">' + 
                            category.status.charAt(0).toUpperCase() + category.status.slice(1) + '</span></td>' +
                            '<td>' + new Date().toLocaleDateString() + '</td>' +
                            '<td>' +
                                '<a href="#" class="action-btn">Edit</a>' +
                                '<a href="#" class="action-btn danger">Delete</a>' +
                            '</td>';
                        tbody.appendChild(row);
                    });
                })
                .catch(error => console.error('Error loading categories:', error));
        }
        
        function openAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'flex';
        }
        
        function closeAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'none';
            document.getElementById('addCategoryForm').reset();
        }
        
        function submitAddCategory() {
            const form = document.getElementById('addCategoryForm');
            const formData = new FormData(form);
            
            if (!formData.get('name')) {
                alert('Category Name is required');
                return;
            }
            
            const categoryData = {
                name: formData.get('name'),
                description: formData.get('description') || '',
                status: formData.get('status')
            };
            
            fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    alert('Category added successfully!');
                    closeAddCategoryModal();
                    loadCategories(); // Reload the table
                } else {
                    alert('Error adding category: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                alert('Error adding category: ' + error.message);
            });
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
</html>
`;

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(mainHTML);
    } else if (pathname === '/admin') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(adminHTML);
    } else if (pathname === '/employee') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(employeeHTML);
    } else if (pathname === '/api/jobs' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jobs));
    } else if (pathname === '/api/categories' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(categories));
    } else if (pathname === '/api/categories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { name, description, status } = JSON.parse(body);
                
                if (!name || name.trim() === '') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Category name is required'
                    }));
                    return;
                }
                
                const newCategory = {
                    id: Date.now(),
                    name: name.trim(),
                    description: description ? description.trim() : '',
                    status: status || 'active'
                };
                
                categories.push(newCategory);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newCategory));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid request format'
                }));
            }
        });
    } else if (pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { username, password, role } = JSON.parse(body);
                
                const users = {
                    'admin': { password: 'admin123', role: 'admin', firstName: 'Admin', lastName: 'User' },
                    'employee': { password: 'employee123', role: 'employee', firstName: 'Employee', lastName: 'User' },
                    'applicant': { password: 'applicant123', role: 'applicant', firstName: 'Applicant', lastName: 'User' }
                };
                
                if (users[username] && users[username].password === password) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        user: {
                            username: username,
                            firstName: users[username].firstName,
                            lastName: users[username].lastName,
                            role: users[username].role
                        }
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Invalid username or password'
                    }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Invalid request format'
                }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Career Portal server running on port ${PORT}`);
    console.log(`🌐 Main site: http://64.225.6.33/`);
    console.log(`🔧 Admin portal: http://64.225.6.33/admin`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});