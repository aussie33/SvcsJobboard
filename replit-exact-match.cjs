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
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 0L35 10V30L20 40L5 30V10L20 0Z" fill="#9333EA"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">RC</text>
                </svg>
                <h1 class="text-2xl font-bold text-gray-900">THE RESOURCE CONSULTANTS</h1>
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
    <div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-20">
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
        <div class="modal-content">
            <span class="close login-close">&times;</span>
            <h2 class="text-2xl font-bold mb-6 text-center">Login to Career Portal</h2>
            <form id="loginForm">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Role</label>
                    <select id="roleSelect" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="applicant">Applicant</option>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                    <input type="text" id="usernameInput" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input type="password" id="passwordInput" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
                    Login
                </button>
            </form>
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

        // Form submissions
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();
            showNotification('Login functionality will be implemented with backend integration');
            loginModal.style.display = 'none';
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
    } else if (req.url === '/api/jobs') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
            {
                id: 1,
                title: "test",
                department: "test",
                location: "Remote",
                type: "Full Time",
                category: "Uncategorized",
                salary: "Salary negotiable",
                posted: "Posted Recently"
            }
        ]));
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