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
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAC50AAAGmCAYAAABFzQFIAAAACXBIWXMAAEzlAABM5QF1zvCVAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYjdjNjRjY2Y5LCAyMDI0LzA3LzE2LTEyOjM5OjA0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjYuMSAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjItMTEtMDVUMDM6MDQ6MjItMDQ6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI1LTAzLTI0VDE3OjUzOjU4LTA0OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDI1LTAzLTI0VDE3OjUzOjU4LTA0OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2ZDgwYmVlYi1kYzFmLTQwYWItOTJmYS1lYmIzNWJjNDBmNmQiIHhtcE1NOkRvY3VtZW50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" alt="The Resource Consultants" class="h-8 w-auto mr-3">
                    </div>
                </div>
                
                <nav class="flex space-x-8">
                    <a href="#" class="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium">Job Listings</a>
                    <a href="/employee" class="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium">Employee Portal</a>
                    <a href="/admin" class="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium">Admin Portal</a>
                </nav>
                
                <div class="flex items-center space-x-4">
                    <button id="loginBtn" class="login-btn">Login</button>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAADACAYAAAA9r2/gAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAB3RJTUUH5AsJBzYsxEeQUgAAAAlwSFlzAAALEwAACxMBAJqcGAAAHDVJREFUeJztnXtsXdeZ3r/7zhxySM7wcpFlSTJla6JYFGUrI3mBbGOzaIBkHbRJX5u0zSbdRYJGLQINugvSdLuYNGnSNIuiRbJF3TRJ0CIpHSTrpLWQ+kVFSO6/8mwGxnvxcLUc9lT7WrqGRJtS1o1/v7+E4EQcIrxlYRKvfMfUXCJpKRmzZsyeS57BmOGrjgAAAABJRU5ErkJggg==" alt="The Resource Consultants" style="height: 40px; margin: 0 auto; display: block;">
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
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAADACAYAAAA9r2/gAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAB3RJTUUH5AsJBzYsxEeQUgAAAAlwSFlzAAALEwAACxMBAJqcGAAAHDVJREFUeJztnXtsXNeZ3r/7zhxySM7wcpFlSTJla6JYFGUrI3mBbGOzaIBkHbRJX5u0zSbdRYJGLQINugvSdLuYNGnSNIuiRbJF3TRJ0CIpHSTrpLWQ+kVFSO6/8mwGxnvxcLUc9lT7WrqGRJtS1o1/v7+E4EQcIrxlYRKvfMfUXCJpKRmzZsyeS57BmOGrjgAAAABJRU5ErkJggg==" alt="The Resource Consultants" style="height: 32px; margin-right: 8px; vertical-align: middle;">
                <span>The Resource Consultants</span>
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
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8AAAADACAYAAAA9r2/gAAAACXBIWXMAABcRAAAXEQHKJvM/AAAAB3RJTUUH5AsJBzYsxEeQUgAAAAlwSFlzAAALEwAACxMBAJqcGAAAHDVJREFUeJztnXtsXNeZ3r/7zhxySM7wcpFlSTJla6JYFGUrI3mBbGOzaIBkHbRJX5u0zSbdRYJGLQINugvSdLuYNGnSNIuiRbJF3TRJ0CIpHSTrpLWQ+kVFSO6/8mwGxnvxcLUc9lT7WrqGRJtS1o1/v7+E4EQcIrxlYRKvfMfUXCJpKRmzZsyeS57BmOGrjgAAAABJRU5ErkJggg==" alt="The Resource Consultants" style="height: 32px; margin-right: 8px; vertical-align: middle;">
                <span>The Resource Consultants</span>
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