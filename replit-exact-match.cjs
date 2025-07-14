const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;

// Create the HTML content matching exact Replit design
const htmlContent = `
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
        .job-detail-item { 
            display: flex; 
            align-items: center; 
            gap: 6px;
        }
        .job-type-badge { 
            background: #9333ea; 
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
        .checkbox-item input[type="checkbox"] { 
            width: 16px; 
            height: 16px; 
            accent-color: #9333ea;
        }
        .location-filter { 
            display: flex; 
            flex-direction: column; 
            gap: 12px;
        }
        .filter-input { 
            padding: 8px 12px; 
            border: 1px solid #d1d5db; 
            border-radius: 4px; 
            font-size: 14px;
        }
        .filter-button { 
            background: #f3f4f6; 
            border: 1px solid #d1d5db; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 14px;
        }
        .filter-button:hover { 
            background: #e5e7eb; 
        }
        .search-section { 
            background: white; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
        }
        .search-input { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #d1d5db; 
            border-radius: 4px; 
            font-size: 16px;
        }
        .search-btn { 
            background: #3b82f6; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-weight: 500; 
            margin-left: 12px;
        }
        .search-btn:hover { 
            background: #2563eb; 
        }
        .modal { 
            display: none; 
            position: fixed; 
            z-index: 1000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0,0,0,0.5); 
        }
        .modal-content { 
            background-color: white; 
            margin: 15% auto; 
            padding: 20px; 
            border-radius: 8px; 
            width: 80%; 
            max-width: 500px; 
        }
        .close { 
            color: #aaa; 
            float: right; 
            font-size: 28px; 
            font-weight: bold; 
            cursor: pointer; 
        }
        .close:hover { 
            color: black; 
        }
        .notification { 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #10b981; 
            color: white; 
            padding: 15px; 
            border-radius: 8px; 
            z-index: 1001; 
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <img src="/logo.png" alt="The Resource Consultants" class="h-16 w-auto" />
            </div>
            <div class="flex items-center space-x-4">
                <a href="#" class="text-purple-600 border-b-2 border-purple-600 pb-1">Job Listings</a>
                <button id="loginBtn" class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition">
                    Log in
                </button>
            </div>
        </div>
    </header>

    <!-- Hero Banner -->
    <div class="bg-purple-600 text-white py-20">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <h1 class="text-5xl font-bold mb-6">Find Your Dream Career</h1>
            <p class="text-xl text-purple-100 mb-8">Explore opportunities that match your skills and ambitions. Your next career move starts here.</p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Explore Job Opportunities</h2>
            <p class="text-lg text-gray-600 mb-8">Find your next career move from our latest job openings</p>
        </div>
        <!-- Search Section -->
        <div class="search-section">
            <div class="flex items-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="mr-3">
                    <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input type="text" id="searchInput" placeholder="Search job titles, skills, or keywords" class="search-input">
                <button class="search-btn">Search</button>
            </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Categories -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Categories</h3>
                    <div class="checkbox-list">
                        <div class="checkbox-item">
                            <input type="checkbox" id="administrative" />
                            <label for="administrative">Administrative</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="agriculture" />
                            <label for="agriculture">Agriculture</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="consulting" />
                            <label for="consulting">Consulting</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="customer-service" />
                            <label for="customer-service">Customer Service</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="data-science" />
                            <label for="data-science">Data Science</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="design" />
                            <label for="design">Design</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="education" />
                            <label for="education">Education</label>
                        </div>
                    </div>
                </div>

                <!-- Location -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Location</h3>
                    <div class="location-filter">
                        <div>
                            <select class="filter-input w-full">
                                <option>All Locations</option>
                                <option>New York</option>
                                <option>Los Angeles</option>
                                <option>Chicago</option>
                                <option>Remote</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">City</label>
                            <div class="flex gap-2">
                                <input type="text" placeholder="Filter by city" class="filter-input flex-1">
                                <button class="filter-button">Apply</button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">State/Province</label>
                            <div class="flex gap-2">
                                <input type="text" placeholder="Filter by state" class="filter-input flex-1">
                                <button class="filter-button">Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Job Listings -->
        <div class="job-listings">
            <div class="job-card">
                <div class="job-title">test</div>
                <div class="job-description">test</div>
                <div class="job-details">
                    <div class="job-detail-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 4v4l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Remote</span>
                    </div>
                    <div class="job-detail-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Full Time</span>
                    </div>
                    <div class="job-detail-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 4h12v8H2z" stroke="currentColor" stroke-width="2"/>
                            <path d="M6 2v4M10 2v4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Uncategorized</span>
                    </div>
                    <div class="job-detail-item">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 7h10M8 2v12" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Posted Recently</span>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="job-type-badge">full time</div>
                    <div class="text-lg font-semibold">Salary negotiable</div>
                    <button class="apply-btn apply-job-btn">Apply Now</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Application Modal -->
    <div id="applicationModal" class="modal">
        <div class="modal-content">
            <span class="close application-close">&times;</span>
            <h2 class="text-2xl font-bold mb-6 text-center">Apply for Position</h2>
            <form id="applicationForm">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                    <input type="text" id="applicantName" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                    <input type="email" id="applicantEmail" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                    <input type="tel" id="applicantPhone" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Resume</label>
                    <input type="file" id="resumeFile" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" accept=".pdf,.doc,.docx" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Cover Letter</label>
                    <textarea id="coverLetter" rows="4" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Tell us why you're a great fit for this position..."></textarea>
                </div>
                <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                    Submit Application
                </button>
            </form>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content" style="max-width: 450px; padding: 0; border-radius: 8px; overflow: hidden;">
            <span class="close login-close" style="position: absolute; top: 10px; right: 20px; z-index: 1001; color: white;">&times;</span>
            
            <!-- Header with logo and gradient -->
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 pt-20 pb-10 px-4 text-white text-center">
                <div class="flex justify-center mb-6 mt-8">
                    <img src="/logo.png" alt="The Resource Consultants" class="h-16 w-auto" />
                </div>
                <p class="text-sm text-white/90 mt-2">Please login or sign up to continue using our app</p>
            </div>
            
            <!-- Account type selector -->
            <div class="bg-gray-100 px-6 py-4">
                <div class="flex flex-wrap justify-center gap-2">
                    <button type="button" class="account-type-btn active" data-role="applicant" style="background: #9333ea; color: white; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Applicant
                    </button>
                    <button type="button" class="account-type-btn" data-role="employee" style="background: #f3f4f6; color: #6b7280; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Employee
                    </button>
                    <button type="button" class="account-type-btn" data-role="admin" style="background: #f3f4f6; color: #6b7280; padding: 8px 16px; border-radius: 20px; border: none; cursor: pointer; font-size: 14px; font-weight: 500;">
                        Admin
                    </button>
                </div>
            </div>
            
            <!-- Login form -->
            <div class="px-6 py-6 bg-white">
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2">Username</label>
                        <input type="text" id="usernameInput" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2">Password</label>
                        <input type="password" id="passwordInput" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                    </div>
                    <div class="flex justify-end mb-4">
                        <button type="button" class="text-sm text-purple-600 font-medium hover:underline">
                            Forgot Password?
                        </button>
                    </div>
                    <button type="submit" class="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg mb-4">
                        Login
                    </button>
                    
                    <!-- Demo accounts section -->
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

    <script>
        // Modal functionality
        const loginModal = document.getElementById('loginModal');
        const applicationModal = document.getElementById('applicationModal');
        const loginBtn = document.getElementById('loginBtn');
        const applyJobBtn = document.querySelector('.apply-job-btn');
        const loginClose = document.querySelector('.login-close');
        const applicationClose = document.querySelector('.application-close');

        loginBtn.onclick = function() {
            loginModal.style.display = 'block';
        }

        applyJobBtn.onclick = function() {
            applicationModal.style.display = 'block';
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

        // Account type selector functionality
        const accountTypeBtns = document.querySelectorAll('.account-type-btn');
        let selectedRole = 'applicant';
        
        accountTypeBtns.forEach(btn => {
            btn.onclick = function() {
                accountTypeBtns.forEach(b => {
                    b.style.background = '#f3f4f6';
                    b.style.color = '#6b7280';
                    b.classList.remove('active');
                });
                this.style.background = '#9333ea';
                this.style.color = 'white';
                this.classList.add('active');
                selectedRole = this.dataset.role;
            };
        });

        // Form submissions
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();
            const username = document.getElementById('usernameInput').value;
            const password = document.getElementById('passwordInput').value;
            
            // Authenticate user
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
                    
                    // Update UI based on role
                    if (data.user.role === 'admin') {
                        // Show admin controls
                        document.getElementById('loginBtn').textContent = 'Admin Portal';
                        document.getElementById('loginBtn').onclick = function() {
                            window.location.href = '/admin';
                        };
                    } else if (data.user.role === 'employee') {
                        // Show employee controls
                        document.getElementById('loginBtn').textContent = 'Employee Portal';
                        document.getElementById('loginBtn').onclick = function() {
                            window.location.href = '/employee';
                        };
                    } else {
                        // Show applicant view
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

        document.getElementById('applicationForm').onsubmit = function(e) {
            e.preventDefault();
            showNotification('Application submitted successfully! We will review your application and get back to you soon.');
            applicationModal.style.display = 'none';
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

// Write HTML to file
fs.writeFileSync('index.html', htmlContent);

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlContent);
    } else if (req.url === '/logo.png') {
        try {
            const logoData = fs.readFileSync('logo.png');
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(logoData);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Logo not found');
        }
    } else if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { username, password, role } = JSON.parse(body);
                
                // Test user accounts
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
    } else if (req.url === '/api/jobs') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            {
                id: 1,
                title: "Software Engineer",
                department: "Engineering",
                location: "Remote",
                type: "Full Time",
                category: "Technology",
                salary: "$80,000 - $120,000",
                posted: "Posted 2 days ago"
            },
            {
                id: 2,
                title: "Marketing Manager",
                department: "Marketing",
                location: "New York, NY",
                type: "Full Time",
                category: "Marketing",
                salary: "$60,000 - $80,000",
                posted: "Posted 1 week ago"
            }
        ]));
    } else if (req.url === '/api/categories' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            { id: 1, name: 'Administrative', description: 'Administrative assistants, office management', status: 'active' },
            { id: 2, name: 'Agriculture', description: 'Farming, agricultural technology, and food production', status: 'active' },
            { id: 3, name: 'Consulting', description: 'Management consulting, technical consulting', status: 'active' },
            { id: 4, name: 'Customer Service', description: 'Customer support, service representatives', status: 'active' },
            { id: 5, name: 'Data Science', description: 'Data analysis, data scientists, and business intelligence', status: 'active' },
            { id: 6, name: 'Design', description: 'Graphic design, UX/UI design, and creative roles', status: 'active' },
            { id: 7, name: 'Education', description: 'Teaching, training, and educational specialists', status: 'active' }
        ]));
    } else if (req.url === '/api/categories' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { name, description, status } = JSON.parse(body);
                
                // Basic validation
                if (!name || name.trim() === '') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: 'Category name is required'
                    }));
                    return;
                }
                
                // Create new category with ID
                const newCategory = {
                    id: Date.now(), // Simple ID generation for demo
                    name: name.trim(),
                    description: description ? description.trim() : '',
                    status: status || 'active'
                };
                
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
    } else if (req.url === '/dashboard' || req.url === '/admin') {
        // Admin portal matching exact Replit design
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Portal - The Resource Consultants</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; color: #333; }
                    
                    .header { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; }
                    .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
                    .logo { display: flex; align-items: center; gap: 8px; }
                    .logo img { height: 32px; }
                    .nav-tabs { display: flex; gap: 32px; }
                    .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; }
                    .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
                    .user-info { display: flex; align-items: center; gap: 16px; color: #6b7280; font-size: 14px; }
                    .logout-btn { color: #6b7280; text-decoration: none; }
                    .logout-btn:hover { color: #9333ea; }
                    
                    .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
                    .page-header { margin-bottom: 32px; }
                    .page-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 4px; }
                    .page-subtitle { color: #6b7280; font-size: 14px; }
                    
                    .section-tabs { display: flex; gap: 32px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
                    .section-tab { padding: 12px 0; color: #6b7280; text-decoration: none; border-bottom: 2px solid transparent; }
                    .section-tab.active { color: #111827; border-bottom-color: #9333ea; font-weight: 500; }
                    
                    .card { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
                    .card-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
                    .card-title { font-size: 16px; font-weight: 600; color: #111827; }
                    .add-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
                    .add-btn:hover { background: #7c3aed; }
                    
                    .table-controls { padding: 20px 24px; display: flex; gap: 16px; align-items: center; }
                    .search-box { flex: 1; max-width: 300px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
                    .filter-select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; }
                    
                    .user-table { width: 100%; }
                    .user-table th, .user-table td { text-align: left; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; }
                    .user-table th { background: #f9fafb; font-weight: 500; color: #6b7280; font-size: 12px; text-transform: uppercase; }
                    .user-table td { color: #111827; font-size: 14px; }
                    
                    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-weight: 500; color: #6b7280; font-size: 12px; }
                    .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
                    .status-active { background: #dcfce7; color: #166534; }
                    .admin-badge { background: #fef3c7; color: #92400e; }
                    
                    .action-btn { color: #9333ea; text-decoration: none; font-size: 14px; margin-right: 12px; }
                    .action-btn:hover { text-decoration: underline; }
                    .action-btn.danger { color: #dc2626; }
                    
                    .table-footer { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; }
                    .results-info { color: #6b7280; font-size: 14px; }
                    .pagination { display: flex; align-items: center; gap: 8px; }
                    .page-select { padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; }
                </style>
            </head>
            <body>
                <header class="header">
                    <div class="header-content">
                        <div class="logo">
                            <img src="/logo.png" alt="The Resource Consultants" />
                        </div>
                        <nav class="nav-tabs">
                            <a href="/" class="nav-tab">Job Listings</a>
                            <a href="/employee" class="nav-tab">Employee Portal</a>
                            <a href="/admin" class="nav-tab active">Admin Portal</a>
                        </nav>
                        <div class="user-info">
                            <span>Hello, Admin</span>
                            <a href="/" class="logout-btn">Log out</a>
                        </div>
                    </div>
                </header>
                
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">Admin Portal</h1>
                        <p class="page-subtitle">Manage user accounts and system settings</p>
                    </div>
                    
                    <div class="section-tabs">
                        <a href="#" class="section-tab active" onclick="showUserManagement(event)">User Management</a>
                        <a href="#" class="section-tab" onclick="showJobCategories(event)">Job Categories</a>
                    </div>
                    
                    <div id="userManagementSection" class="card">
                        <div class="card-header">
                            <h2 class="card-title">Portal User Accounts</h2>
                            <button class="add-btn" onclick="openAddUserModal()">Add New User</button>
                        </div>
                        
                        <div class="table-controls">
                            <input type="text" class="search-box" placeholder="Search users..." />
                            <select class="filter-select">
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Employee</option>
                                <option>Applicant</option>
                            </select>
                            <select class="filter-select">
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>
                        
                        <table class="user-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Admin Type</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="user-avatar">TT</div>
                                            <span>test testa</span>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td>Employee</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>N/A</td>
                                    <td>Jun 24, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Disable</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="user-avatar">EU</div>
                                            <span>Employee User</span>
                                        </div>
                                    </td>
                                    <td>employee@theresourceconsultants.com</td>
                                    <td>Employee</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>N/A</td>
                                    <td>Jun 24, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Disable</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="user-avatar">JD</div>
                                            <span>John Doe</span>
                                        </div>
                                    </td>
                                    <td>applicant@example.com</td>
                                    <td>Applicant</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>N/A</td>
                                    <td>Jul 8, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Disable</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 12px;">
                                            <div class="user-avatar">AU</div>
                                            <span>Admin User</span>
                                        </div>
                                    </td>
                                    <td>admin@theresourceconsultants.com</td>
                                    <td>Admin</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td><span class="status-badge admin-badge">Super Admin</span></td>
                                    <td>Jul 14, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Disable</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="table-footer">
                            <div class="results-info">Showing 1 to 4 of 4 results</div>
                            <div class="pagination">
                                <span>Show</span>
                                <select class="page-select">
                                    <option>20</option>
                                    <option>50</option>
                                    <option>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div id="jobCategoriesSection" class="card" style="display: none;">
                        <div class="card-header">
                            <h2 class="card-title">Job Categories</h2>
                            <button class="add-btn" onclick="openAddCategoryModal()">Add New Category</button>
                        </div>
                        
                        <div class="table-controls">
                            <input type="text" class="search-box" placeholder="Search categories..." />
                            <select class="filter-select">
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>
                        
                        <table class="user-table">
                            <thead>
                                <tr>
                                    <th>Category Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Administrative</td>
                                    <td>Administrative and office support roles</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>Jun 15, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Delete</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Technology</td>
                                    <td>Software development and IT positions</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>Jun 15, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Delete</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Marketing</td>
                                    <td>Marketing and communications roles</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                    <td>Jun 15, 2025</td>
                                    <td>
                                        <a href="#" class="action-btn">Edit</a>
                                        <a href="#" class="action-btn danger">Delete</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="table-footer">
                            <div class="results-info">Showing 1 to 3 of 3 results</div>
                            <div class="pagination">
                                <span>Show</span>
                                <select class="page-select">
                                    <option>20</option>
                                    <option>50</option>
                                    <option>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Add User Modal -->
                <div id="addUserModal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Add New User</h3>
                            <span class="close" onclick="closeAddUserModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="addUserForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>First Name*</label>
                                        <input type="text" name="firstName" placeholder="John" required />
                                    </div>
                                    <div class="form-group">
                                        <label>Last Name*</label>
                                        <input type="text" name="lastName" placeholder="Doe" required />
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Middle Name</label>
                                        <input type="text" name="middleName" placeholder="A." />
                                    </div>
                                    <div class="form-group">
                                        <label>Preferred Name</label>
                                        <input type="text" name="preferredName" placeholder="Johnny" />
                                        <small>If provided, this name will be displayed in greetings</small>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Username</label>
                                        <input type="text" name="username" placeholder="johndoe" />
                                    </div>
                                    <div class="form-group">
                                        <label>Email Address</label>
                                        <input type="email" name="email" placeholder="john.doe@example.com" />
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Password</label>
                                        <input type="password" name="password" placeholder="••••••••" />
                                    </div>
                                    <div class="form-group">
                                        <label>Confirm Password</label>
                                        <input type="password" name="confirmPassword" placeholder="••••••••" />
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Role</label>
                                        <select name="role">
                                            <option value="employee">Employee</option>
                                            <option value="admin">Admin</option>
                                            <option value="applicant">Applicant</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Department</label>
                                        <input type="text" name="department" placeholder="e.g. Engineering" />
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Status</label>
                                    <div class="radio-group">
                                        <label class="radio-label">
                                            <input type="radio" name="status" value="active" checked />
                                            <span class="radio-custom"></span>
                                            Active
                                        </label>
                                        <label class="radio-label">
                                            <input type="radio" name="status" value="inactive" />
                                            <span class="radio-custom"></span>
                                            Inactive
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label>Notes</label>
                                    <textarea name="notes" placeholder="Additional notes about this user" rows="3"></textarea>
                                    <small>These notes are for administrative purposes only</small>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" onclick="closeAddUserModal()">Cancel</button>
                            <button type="button" class="btn-primary" onclick="submitAddUser()">Add User</button>
                        </div>
                    </div>
                </div>
                
                <!-- Add Category Modal -->
                <div id="addCategoryModal" class="modal" style="display: none;">
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
                                            <span class="radio-custom"></span>
                                            Active
                                        </label>
                                        <label class="radio-label">
                                            <input type="radio" name="status" value="inactive" />
                                            <span class="radio-custom"></span>
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
                    function showUserManagement(event) {
                        event.preventDefault();
                        document.getElementById('userManagementSection').style.display = 'block';
                        document.getElementById('jobCategoriesSection').style.display = 'none';
                        
                        // Update active tab
                        document.querySelectorAll('.section-tab').forEach(tab => tab.classList.remove('active'));
                        event.target.classList.add('active');
                    }
                    
                    function showJobCategories(event) {
                        event.preventDefault();
                        document.getElementById('userManagementSection').style.display = 'none';
                        document.getElementById('jobCategoriesSection').style.display = 'block';
                        
                        // Update active tab
                        document.querySelectorAll('.section-tab').forEach(tab => tab.classList.remove('active'));
                        event.target.classList.add('active');
                    }
                    
                    function openAddUserModal() {
                        document.getElementById('addUserModal').style.display = 'block';
                    }
                    
                    function closeAddUserModal() {
                        document.getElementById('addUserModal').style.display = 'none';
                        document.getElementById('addUserForm').reset();
                    }
                    
                    function submitAddUser() {
                        const form = document.getElementById('addUserForm');
                        const formData = new FormData(form);
                        
                        // Basic validation
                        if (!formData.get('firstName') || !formData.get('lastName')) {
                            alert('First Name and Last Name are required');
                            return;
                        }
                        
                        if (formData.get('password') !== formData.get('confirmPassword')) {
                            alert('Passwords do not match');
                            return;
                        }
                        
                        // Here you would normally send the data to your server
                        alert('User creation functionality will be implemented in the next phase');
                        closeAddUserModal();
                    }
                    
                    function openAddCategoryModal() {
                        document.getElementById('addCategoryModal').style.display = 'block';
                    }
                    
                    function closeAddCategoryModal() {
                        document.getElementById('addCategoryModal').style.display = 'none';
                        document.getElementById('addCategoryForm').reset();
                    }
                    
                    function submitAddCategory() {
                        const form = document.getElementById('addCategoryForm');
                        const formData = new FormData(form);
                        
                        // Basic validation
                        if (!formData.get('name')) {
                            alert('Category Name is required');
                            return;
                        }
                        
                        // Create category object
                        const categoryData = {
                            name: formData.get('name'),
                            description: formData.get('description') || '',
                            status: formData.get('status')
                        };
                        
                        // Send to server
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
                                // Success - add to table
                                addCategoryToTable(data);
                                closeAddCategoryModal();
                                alert('Category added successfully!');
                            } else {
                                alert('Error adding category: ' + (data.message || 'Unknown error'));
                            }
                        })
                        .catch(error => {
                            alert('Error adding category: ' + error.message);
                        });
                    }
                    
                    function addCategoryToTable(category) {
                        const tableBody = document.querySelector('#jobCategoriesSection table tbody');
                        const newRow = document.createElement('tr');
                        
                        const currentDate = new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        
                        newRow.innerHTML = '<td>' + category.name + '</td>' +
                            '<td>' + category.description + '</td>' +
                            '<td><span class="status-badge status-' + category.status.toLowerCase() + '">' + 
                            category.status.charAt(0).toUpperCase() + category.status.slice(1) + '</span></td>' +
                            '<td>' + currentDate + '</td>' +
                            '<td><a href="#" class="action-btn">Edit</a>' +
                            '<a href="#" class="action-btn danger">Delete</a></td>';
                        
                        tableBody.appendChild(newRow);
                    }
                    
                    // Close modal when clicking outside
                    window.onclick = function(event) {
                        const userModal = document.getElementById('addUserModal');
                        const categoryModal = document.getElementById('addCategoryModal');
                        
                        if (event.target === userModal) {
                            closeAddUserModal();
                        }
                        
                        if (event.target === categoryModal) {
                            closeAddCategoryModal();
                        }
                    }
                </script>
                
                <style>
                    .modal {
                        position: fixed;
                        z-index: 1000;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0,0,0,0.5);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    
                    .modal-content {
                        background-color: white;
                        border-radius: 8px;
                        width: 90%;
                        max-width: 600px;
                        max-height: 90vh;
                        overflow-y: auto;
                    }
                    
                    .modal-header {
                        padding: 20px 24px;
                        border-bottom: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .modal-header h3 {
                        margin: 0;
                        color: #111827;
                        font-size: 18px;
                        font-weight: 600;
                    }
                    
                    .close {
                        color: #6b7280;
                        font-size: 24px;
                        font-weight: bold;
                        cursor: pointer;
                    }
                    
                    .close:hover {
                        color: #111827;
                    }
                    
                    .modal-body {
                        padding: 24px;
                    }
                    
                    .form-row {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 16px;
                    }
                    
                    .form-group {
                        flex: 1;
                    }
                    
                    .form-group label {
                        display: block;
                        margin-bottom: 6px;
                        color: #374151;
                        font-size: 14px;
                        font-weight: 500;
                    }
                    
                    .form-group input,
                    .form-group select,
                    .form-group textarea {
                        width: 100%;
                        padding: 8px 12px;
                        border: 1px solid #d1d5db;
                        border-radius: 6px;
                        font-size: 14px;
                        color: #111827;
                    }
                    
                    .form-group input:focus,
                    .form-group select:focus,
                    .form-group textarea:focus {
                        outline: none;
                        border-color: #9333ea;
                        box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
                    }
                    
                    .form-group small {
                        color: #6b7280;
                        font-size: 12px;
                        margin-top: 4px;
                        display: block;
                    }
                    
                    .radio-group {
                        display: flex;
                        gap: 16px;
                        margin-top: 8px;
                    }
                    
                    .radio-label {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        color: #374151;
                    }
                    
                    .radio-label input[type="radio"] {
                        display: none;
                    }
                    
                    .radio-custom {
                        width: 16px;
                        height: 16px;
                        border: 2px solid #d1d5db;
                        border-radius: 50%;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .radio-label input[type="radio"]:checked + .radio-custom {
                        border-color: #9333ea;
                    }
                    
                    .radio-label input[type="radio"]:checked + .radio-custom::after {
                        content: '';
                        width: 8px;
                        height: 8px;
                        background-color: #9333ea;
                        border-radius: 50%;
                    }
                    
                    .modal-footer {
                        padding: 20px 24px;
                        border-top: 1px solid #e5e7eb;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                    }
                    
                    .btn-cancel {
                        padding: 8px 16px;
                        border: 1px solid #d1d5db;
                        background: white;
                        color: #374151;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .btn-cancel:hover {
                        background: #f9fafb;
                    }
                    
                    .btn-primary {
                        padding: 8px 16px;
                        border: none;
                        background: #9333ea;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    
                    .btn-primary:hover {
                        background: #7c3aed;
                    }
                </style>
            </body>
            </html>
        `);
    } else if (req.url === '/employee') {
        // Employee portal placeholder
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Portal - The Resource Consultants</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
                    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                    .logo { height: 40px; margin-bottom: 20px; }
                    h1 { color: #9333ea; margin-bottom: 20px; }
                    p { color: #666; margin-bottom: 30px; }
                    .btn { background: #9333ea; color: white; padding: 12px 24px; border: none; border-radius: 6px; text-decoration: none; display: inline-block; }
                    .btn:hover { background: #7c3aed; }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="/logo.png" alt="The Resource Consultants" class="logo" />
                    <h1>Employee Portal</h1>
                    <p>Employee portal features are coming soon. You can manage job postings and applications here.</p>
                    <a href="/" class="btn">Back to Job Portal</a>
                </div>
            </body>
            </html>
        `);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Career Portal server running on port ${PORT}`);
    console.log(`🌐 Access at: http://64.225.6.33`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});