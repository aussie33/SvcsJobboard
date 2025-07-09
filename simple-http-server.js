const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;

// Create the HTML content
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
        .gradient-bg { background: linear-gradient(135deg, #9C27B0 0%, #8E24AA 100%); }
        .job-card { transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .job-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; }
        .badge-location { background-color: #3B82F6; color: white; }
        .badge-type { background-color: #10B981; color: white; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: white; margin: 15% auto; padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
        .notification { position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 15px; border-radius: 8px; z-index: 1001; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-lg">RC</span>
                </div>
                <h1 class="text-2xl font-bold text-gray-900">The Resource Consultants</h1>
            </div>
            <button id="loginBtn" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                Login
            </button>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="gradient-bg text-white py-20">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-4xl font-bold mb-4">Find Your Dream Career</h2>
            <p class="text-xl mb-8 text-purple-100">Find your next career move with our comprehensive job board</p>
            <div class="max-w-2xl mx-auto">
                <div class="relative">
                    <input type="text" id="searchInput" placeholder="Search for jobs, companies, or keywords..." 
                           class="w-full px-6 py-4 text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-300">
                    <button class="absolute right-2 top-2 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition">
                        Search
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Job Filters -->
    <section class="bg-white py-8 border-b">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>All Categories</option>
                    <option>Administrative</option>
                    <option>Agriculture</option>
                    <option>Consulting</option>
                    <option>Engineering</option>
                    <option>Finance</option>
                    <option>Healthcare</option>
                    <option>IT</option>
                    <option>Legal</option>
                    <option>Marketing</option>
                    <option>Operations</option>
                    <option>Sales</option>
                </select>
                <select class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>All Locations</option>
                    <option>New York</option>
                    <option>Los Angeles</option>
                    <option>Chicago</option>
                    <option>Remote</option>
                </select>
                <select class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option>All Types</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                </select>
                <button class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                    Apply Filters
                </button>
            </div>
        </div>
    </section>

    <!-- Job Listings -->
    <section class="py-12">
        <div class="container mx-auto px-4">
            <h3 class="text-3xl font-bold text-gray-900 mb-8">Explore Job Opportunities</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Sample Job Cards -->
                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">Software Engineer</h4>
                    <p class="text-gray-600 mb-4">We are looking for a talented Software Engineer to join our team...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">New York</span>
                        <span class="badge badge-type">Full-time</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$80,000 - $120,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>

                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">Marketing Manager</h4>
                    <p class="text-gray-600 mb-4">Join our marketing team to drive brand awareness and growth...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">Los Angeles</span>
                        <span class="badge badge-type">Full-time</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$65,000 - $85,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>

                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">Data Analyst</h4>
                    <p class="text-gray-600 mb-4">Analyze data trends and provide insights to drive business decisions...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">Remote</span>
                        <span class="badge badge-type">Contract</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$70,000 - $90,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>

                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">UX Designer</h4>
                    <p class="text-gray-600 mb-4">Create intuitive and beautiful user experiences for our products...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">Chicago</span>
                        <span class="badge badge-type">Full-time</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$70,000 - $95,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>

                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">Project Manager</h4>
                    <p class="text-gray-600 mb-4">Lead cross-functional teams to deliver projects on time and budget...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">Remote</span>
                        <span class="badge badge-type">Full-time</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$75,000 - $100,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>

                <div class="job-card bg-white rounded-lg p-6 border">
                    <h4 class="text-xl font-semibold text-gray-900 mb-2">Sales Representative</h4>
                    <p class="text-gray-600 mb-4">Drive revenue growth by building relationships with new clients...</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="badge badge-location">New York</span>
                        <span class="badge badge-type">Full-time</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-purple-600 font-semibold">$50,000 - $80,000</span>
                        <button class="apply-btn bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
                            Apply Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <div class="gradient-bg text-white p-6 rounded-t-lg -m-5 mb-5">
                <h2 class="text-2xl font-bold text-center">Login to Career Portal</h2>
            </div>
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

    <!-- Application Modal -->
    <div id="applicationModal" class="modal">
        <div class="modal-content">
            <span class="close application-close">&times;</span>
            <div class="gradient-bg text-white p-6 rounded-t-lg -m-5 mb-5">
                <h2 class="text-2xl font-bold text-center">Apply for Position</h2>
            </div>
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

    <script>
        // Modal functionality
        const loginModal = document.getElementById('loginModal');
        const applicationModal = document.getElementById('applicationModal');
        const loginBtn = document.getElementById('loginBtn');
        const applyBtns = document.querySelectorAll('.apply-btn');
        const closeBtns = document.querySelectorAll('.close');
        const applicationClose = document.querySelector('.application-close');

        loginBtn.onclick = function() {
            loginModal.style.display = 'block';
        }

        applyBtns.forEach(btn => {
            btn.onclick = function() {
                applicationModal.style.display = 'block';
            }
        });

        closeBtns.forEach(btn => {
            btn.onclick = function() {
                loginModal.style.display = 'none';
                applicationModal.style.display = 'none';
            }
        });

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
            showNotification('✅ Application submitted successfully! We will review your application and get back to you soon.');
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
                title: "Software Engineer",
                department: "Engineering",
                location: "New York",
                type: "Full-time",
                category: "Engineering",
                salary: "$80,000 - $120,000"
            },
            {
                id: 2,
                title: "Marketing Manager",
                department: "Marketing",
                location: "Los Angeles",
                type: "Full-time",
                category: "Marketing",
                salary: "$65,000 - $85,000"
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