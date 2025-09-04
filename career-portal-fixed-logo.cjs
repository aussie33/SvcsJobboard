const http = require('http');
const fs = require('fs');
const path = require('path');

// In-memory storage for jobs, categories, and users
let jobs = [
    { id: 1, title: "Senior Software Engineer", department: "Engineering", location: "New York, NY", type: "Full-time", category: "Information Technology", description: "We are seeking a skilled Senior Software Engineer to join our dynamic team.", requirements: "5+ years of experience in software development", posted: "2025-01-10" },
    { id: 2, title: "Product Manager", department: "Product", location: "San Francisco, CA", type: "Full-time", category: "Product Management", description: "Looking for an experienced Product Manager to lead our product initiatives.", requirements: "3+ years of product management experience", posted: "2025-01-08" },
    { id: 3, title: "UX Designer", department: "Design", location: "Remote", type: "Full-time", category: "Design", description: "Join our design team to create exceptional user experiences.", requirements: "Portfolio showcasing UX design skills", posted: "2025-01-05" },
    { id: 4, title: "Data Scientist", department: "Analytics", location: "Austin, TX", type: "Full-time", category: "Data Science", description: "Analyze complex data to drive business decisions.", requirements: "PhD in Data Science or related field", posted: "2025-01-12" },
    { id: 5, title: "Marketing Specialist", department: "Marketing", location: "Chicago, IL", type: "Part-time", category: "Marketing", description: "Develop and execute marketing campaigns.", requirements: "2+ years of marketing experience", posted: "2025-01-15" },
    { id: 6, title: "DevOps Engineer", department: "Engineering", location: "Seattle, WA", type: "Full-time", category: "Information Technology", description: "Build and maintain our infrastructure.", requirements: "Experience with AWS, Docker, Kubernetes", posted: "2025-01-18" }
];

let categories = [
    { id: 1, name: "Information Technology", description: "Technology and software development roles" },
    { id: 2, name: "Product Management", description: "Product strategy and management positions" },
    { id: 3, name: "Design", description: "User experience and graphic design roles" },
    { id: 4, name: "Data Science", description: "Data analysis and machine learning positions" },
    { id: 5, name: "Marketing", description: "Marketing and communications roles" },
    { id: 6, name: "Administrative", description: "Administrative and support positions" },
    { id: 7, name: "Agriculture", description: "Agricultural and farming positions" },
    { id: 8, name: "Consulting", description: "Consulting and advisory roles" },
    { id: 9, name: "Education", description: "Teaching and educational positions" },
    { id: 10, name: "Finance", description: "Financial and accounting roles" },
    { id: 11, name: "Healthcare", description: "Medical and healthcare positions" },
    { id: 12, name: "Human Resources", description: "HR and talent management roles" },
    { id: 13, name: "Legal", description: "Legal and compliance positions" },
    { id: 14, name: "Manufacturing", description: "Manufacturing and production roles" },
    { id: 15, name: "Sales", description: "Sales and business development positions" }
];

let users = [
    { id: 1, email: "admin@example.com", password: "admin123", role: "admin", name: "Administrator" },
    { id: 2, email: "employee@example.com", password: "employee123", role: "employee", name: "Employee User" },
    { id: 3, email: "applicant@example.com", password: "applicant123", role: "applicant", name: "Job Applicant" }
];

// Session storage
let sessions = {};

// Utility functions
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

function parseCookies(req) {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
        });
    }
    return cookies;
}

function setCookie(res, name, value, options = {}) {
    let cookieString = `${name}=${value}`;
    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
    if (options.path) cookieString += `; Path=${options.path}`;
    if (options.httpOnly) cookieString += `; HttpOnly`;
    res.setHeader('Set-Cookie', cookieString);
}

function requireAuth(req, res) {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    
    if (!sessionId || !sessions[sessionId]) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Unauthorized' }));
        return null;
    }
    
    return sessions[sessionId];
}

function getHomePage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Resource Consultants - Career Portal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-text {
            background: linear-gradient(45deg, #9C27B0, #8E24AA);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #9C27B0, #8E24AA);
        }
        .job-card {
            transition: all 0.3s ease;
            border: 1px solid #e5e7eb;
        }
        .job-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
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
            background-color: #fefefe;
            margin: 5% auto;
            padding: 0;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            position: relative;
        }
        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            padding: 10px 15px;
            cursor: pointer;
        }
        .close:hover {
            color: #000;
        }
        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .badge-location {
            background-color: #FEF3C7;
            color: #92400E;
        }
        .badge-type {
            background-color: #D1FAE5;
            color: #065F46;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center">
                        <img src="/logo.png" alt="The Resource Consultants" class="h-8 w-auto mr-3">
                        <span class="text-xl font-bold">The Resource Consultants</span>
                    </div>
                </div>
                
                <nav class="flex space-x-8">
                    <a href="/" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Job Listings</a>
                    <button onclick="openLoginModal()" class="bg-white text-purple-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-50">
                        Login
                    </button>
                </nav>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="gradient-bg text-white py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 class="text-4xl md:text-6xl font-bold mb-6">Find Your Dream Career</h1>
            <p class="text-xl md:text-2xl mb-8 text-purple-100">Find your next career move with The Resource Consultants</p>
            <div class="flex justify-center">
                <div class="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
                    <input type="text" id="searchInput" placeholder="Search jobs..." class="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <button onclick="searchJobs()" class="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200">
                        Search Jobs
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Job Listings -->
    <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Filters Sidebar -->
                <div class="lg:w-1/4">
                    <div class="bg-white rounded-lg shadow-md p-6 sticky top-4">
                        <h3 class="text-lg font-semibold mb-4">Filter Jobs</h3>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Category</label>
                            <select id="categoryFilter" class="w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Categories</option>
                            </select>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Location</label>
                            <select id="locationFilter" class="w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Locations</option>
                            </select>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Job Type</label>
                            <select id="typeFilter" class="w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Types</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                        
                        <button onclick="applyFilters()" class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200">
                            Apply Filters
                        </button>
                    </div>
                </div>

                <!-- Job Cards -->
                <div class="lg:w-3/4">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-900">Explore Job Opportunities</h2>
                        <span id="jobCount" class="text-gray-600"></span>
                    </div>
                    
                    <div id="jobGrid" class="grid gap-6">
                        <!-- Job cards will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="gradient-bg text-white p-6 rounded-t-lg">
                <span class="close" onclick="closeLoginModal()">&times;</span>
                <h2 class="text-2xl font-bold mb-4">Login to Your Account</h2>
            </div>
            <form id="loginForm" class="p-6">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="loginEmail" class="w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" id="loginPassword" class="w-full border border-gray-300 rounded-md px-3 py-2" required>
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Role</label>
                    <select id="loginRole" class="w-full border border-gray-300 rounded-md px-3 py-2">
                        <option value="applicant">Applicant</option>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200">
                    Login
                </button>
            </form>
        </div>
    </div>

    <!-- Job Detail Modal -->
    <div id="jobModal" class="modal">
        <div class="modal-content">
            <div class="gradient-bg text-white p-6 rounded-t-lg">
                <span class="close" onclick="closeJobModal()">&times;</span>
                <h2 id="jobModalTitle" class="text-2xl font-bold mb-4"></h2>
            </div>
            <div id="jobModalContent" class="p-6">
                <!-- Job details will be populated here -->
            </div>
        </div>
    </div>

    <script>
        let allJobs = [];
        let allCategories = [];
        let currentUser = null;

        // Load data on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadJobs();
            loadCategories();
            checkAuth();
        });

        async function loadJobs() {
            try {
                const response = await fetch('/api/jobs');
                if (response.ok) {
                    allJobs = await response.json();
                    displayJobs(allJobs);
                    populateFilters();
                }
            } catch (error) {
                console.error('Error loading jobs:', error);
            }
        }

        async function loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    allCategories = await response.json();
                    populateCategories();
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        async function checkAuth() {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    currentUser = await response.json();
                }
            } catch (error) {
                console.log('Not authenticated');
            }
        }

        function displayJobs(jobs) {
            const jobGrid = document.getElementById('jobGrid');
            const jobCount = document.getElementById('jobCount');
            
            jobCount.textContent = jobs.length + ' jobs found';
            
            jobGrid.innerHTML = jobs.map(job => `
                <div class="job-card bg-white rounded-lg shadow-md p-6 cursor-pointer" onclick="openJobModal(${job.id})">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${job.title}</h3>
                            <p class="text-gray-600 mb-2">${job.department}</p>
                        </div>
                        <span class="text-sm text-gray-500">${job.posted}</span>
                    </div>
                    <p class="text-gray-700 mb-4">${job.description}</p>
                    <div class="flex flex-wrap gap-2">
                        <span class="badge badge-location">${job.location}</span>
                        <span class="badge badge-type">${job.type}</span>
                        <span class="badge" style="background-color: #EDE9FE; color: #5B21B6;">${job.category}</span>
                    </div>
                </div>
            `).join('');
        }

        function populateFilters() {
            const locations = [...new Set(allJobs.map(job => job.location))];
            const locationFilter = document.getElementById('locationFilter');
            
            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = location;
                locationFilter.appendChild(option);
            });
        }

        function populateCategories() {
            const categoryFilter = document.getElementById('categoryFilter');
            
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
        }

        function applyFilters() {
            const categoryFilter = document.getElementById('categoryFilter').value;
            const locationFilter = document.getElementById('locationFilter').value;
            const typeFilter = document.getElementById('typeFilter').value;
            
            let filteredJobs = allJobs;
            
            if (categoryFilter) {
                filteredJobs = filteredJobs.filter(job => job.category === categoryFilter);
            }
            
            if (locationFilter) {
                filteredJobs = filteredJobs.filter(job => job.location === locationFilter);
            }
            
            if (typeFilter) {
                filteredJobs = filteredJobs.filter(job => job.type === typeFilter);
            }
            
            displayJobs(filteredJobs);
        }

        function searchJobs() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filteredJobs = allJobs.filter(job => 
                job.title.toLowerCase().includes(searchTerm) ||
                job.department.toLowerCase().includes(searchTerm) ||
                job.description.toLowerCase().includes(searchTerm)
            );
            displayJobs(filteredJobs);
        }

        function openJobModal(jobId) {
            const job = allJobs.find(j => j.id === jobId);
            if (job) {
                document.getElementById('jobModalTitle').textContent = job.title;
                document.getElementById('jobModalContent').innerHTML = `
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold mb-2">Job Details</h3>
                        <p class="text-gray-700 mb-2"><strong>Department:</strong> ${job.department}</p>
                        <p class="text-gray-700 mb-2"><strong>Location:</strong> ${job.location}</p>
                        <p class="text-gray-700 mb-2"><strong>Type:</strong> ${job.type}</p>
                        <p class="text-gray-700 mb-4"><strong>Category:</strong> ${job.category}</p>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold mb-2">Description</h3>
                        <p class="text-gray-700 mb-4">${job.description}</p>
                    </div>
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-2">Requirements</h3>
                        <p class="text-gray-700 mb-4">${job.requirements}</p>
                    </div>
                    <button onclick="applyForJob(${job.id})" class="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200">
                        Apply Now
                    </button>
                `;
                document.getElementById('jobModal').style.display = 'block';
            }
        }

        function closeJobModal() {
            document.getElementById('jobModal').style.display = 'none';
        }

        function applyForJob(jobId) {
            alert('Application submitted successfully!');
            closeJobModal();
        }

        function openLoginModal() {
            document.getElementById('loginModal').style.display = 'block';
        }

        function closeLoginModal() {
            document.getElementById('loginModal').style.display = 'none';
        }

        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('loginRole').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role })
                });

                if (response.ok) {
                    const user = await response.json();
                    currentUser = user;
                    closeLoginModal();
                    
                    // Redirect based on role
                    if (user.role === 'admin') {
                        window.location.href = '/admin';
                    } else if (user.role === 'employee') {
                        window.location.href = '/employee';
                    } else {
                        location.reload();
                    }
                } else {
                    alert('Login failed. Please check your credentials.');
                }
            } catch (error) {
                alert('Login error. Please try again.');
            }
        });

        // Close modals when clicking outside
        window.onclick = function(event) {
            const loginModal = document.getElementById('loginModal');
            const jobModal = document.getElementById('jobModal');
            
            if (event.target === loginModal) {
                closeLoginModal();
            }
            if (event.target === jobModal) {
                closeJobModal();
            }
        }
    </script>
</body>
</html>
    `;
}

// Create server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        // Serve logo.png
        if (url.pathname === '/logo.png') {
            const logoPath = path.join(__dirname, 'logo.png');
            if (fs.existsSync(logoPath)) {
                const logoData = fs.readFileSync(logoPath);
                res.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': logoData.length
                });
                res.end(logoData);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Logo not found');
            }
            return;
        }

        // Home page
        if (url.pathname === '/' && method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getHomePage());
            return;
        }

        // API Routes
        if (url.pathname.startsWith('/api/')) {
            res.setHeader('Content-Type', 'application/json');

            // Auth routes
            if (url.pathname === '/api/auth/login' && method === 'POST') {
                const body = await parseBody(req);
                const { email, password, role } = body;
                
                const user = users.find(u => u.email === email && u.password === password && u.role === role);
                
                if (user) {
                    const sessionId = generateSessionId();
                    sessions[sessionId] = { userId: user.id, role: user.role, email: user.email, name: user.name };
                    
                    setCookie(res, 'sessionId', sessionId, { maxAge: 86400, path: '/', httpOnly: true });
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }));
                } else {
                    res.writeHead(401);
                    res.end(JSON.stringify({ message: 'Invalid credentials' }));
                }
                return;
            }

            if (url.pathname === '/api/auth/me' && method === 'GET') {
                const session = requireAuth(req, res);
                if (!session) return;
                
                const user = users.find(u => u.id === session.userId);
                if (user) {
                    res.writeHead(200);
                    res.end(JSON.stringify({ id: user.id, email: user.email, role: user.role, name: user.name }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ message: 'User not found' }));
                }
                return;
            }

            // Jobs routes
            if (url.pathname === '/api/jobs' && method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(jobs));
                return;
            }

            if (url.pathname === '/api/jobs' && method === 'POST') {
                const session = requireAuth(req, res);
                if (!session) return;
                
                const body = await parseBody(req);
                const newJob = {
                    id: Math.max(...jobs.map(j => j.id)) + 1,
                    ...body,
                    posted: new Date().toISOString().split('T')[0]
                };
                
                jobs.push(newJob);
                res.writeHead(201);
                res.end(JSON.stringify(newJob));
                return;
            }

            // Categories routes
            if (url.pathname === '/api/categories' && method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify(categories));
                return;
            }

            if (url.pathname === '/api/categories' && method === 'POST') {
                const session = requireAuth(req, res);
                if (!session) return;
                
                const body = await parseBody(req);
                const newCategory = {
                    id: Math.max(...categories.map(c => c.id)) + 1,
                    ...body
                };
                
                categories.push(newCategory);
                res.writeHead(201);
                res.end(JSON.stringify(newCategory));
                return;
            }
        }

        // Admin Portal
        if (url.pathname === '/admin' && method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getAdminPage());
            return;
        }

        // Employee Portal
        if (url.pathname === '/employee' && method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getEmployeePage());
            return;
        }

        // 404 for all other routes
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

function getAdminPage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Portal - The Resource Consultants</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #9C27B0, #8E24AA); }
        .tab-button { transition: all 0.3s ease; }
        .tab-button.active { background-color: #9C27B0; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="bg-gray-50">
    <header class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center">
                        <img src="/logo.png" alt="The Resource Consultants" class="h-8 w-auto mr-3">
                        <span class="text-xl font-bold">Admin Portal</span>
                    </div>
                </div>
                <nav class="flex space-x-8">
                    <a href="/" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Job Listings</a>
                    <a href="/admin" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Admin Portal</a>
                    <a href="/employee" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Employee Portal</a>
                </nav>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-md">
            <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-6" aria-label="Tabs">
                    <button onclick="showTab('users')" class="tab-button py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        User Management
                    </button>
                    <button onclick="showTab('categories')" class="tab-button active py-4 px-1 border-b-2 border-purple-500 font-medium text-sm">
                        Job Categories
                    </button>
                    <button onclick="showTab('settings')" class="tab-button py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        System Settings
                    </button>
                </nav>
            </div>

            <div id="users" class="tab-content p-6">
                <h2 class="text-xl font-semibold mb-6">User Management</h2>
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-medium">Administrator</h3>
                        <p class="text-sm text-gray-600">admin@example.com</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-medium">Employee User</h3>
                        <p class="text-sm text-gray-600">employee@example.com</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-medium">Job Applicant</h3>
                        <p class="text-sm text-gray-600">applicant@example.com</p>
                    </div>
                </div>
            </div>

            <div id="categories" class="tab-content active p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">Job Categories</h2>
                    <button onclick="openAddCategoryModal()" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200">
                        Add New Category
                    </button>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="categoriesTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Categories will be populated here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="settings" class="tab-content p-6">
                <h2 class="text-xl font-semibold mb-6">System Settings</h2>
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-medium mb-2">Application Settings</h3>
                        <p class="text-sm text-gray-600">Configure global application settings</p>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-medium mb-2">Email Configuration</h3>
                        <p class="text-sm text-gray-600">Set up email notifications and templates</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Category Modal -->
    <div id="addCategoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" style="display: none;">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="gradient-bg text-white p-4 rounded-t-md">
                <h3 class="text-lg font-bold">Add New Category</h3>
            </div>
            <form id="addCategoryForm" class="p-4">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Category Name</label>
                    <input type="text" id="categoryName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Description</label>
                    <textarea id="categoryDescription" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" rows="3" required></textarea>
                </div>
                <div class="flex items-center justify-between">
                    <button type="button" onclick="closeAddCategoryModal()" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                    <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                        Add Category
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script>
        let categories = [];

        document.addEventListener('DOMContentLoaded', function() {
            loadCategories();
        });

        function showTab(tabName) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        async function loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    categories = await response.json();
                    displayCategories();
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        }

        function displayCategories() {
            const tbody = document.getElementById('categoriesTableBody');
            tbody.innerHTML = categories.map(category => `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${category.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${category.description}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button class="text-purple-600 hover:text-purple-900">Edit</button>
                        <button class="text-red-600 hover:text-red-900 ml-2">Delete</button>
                    </td>
                </tr>
            `).join('');
        }

        function openAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'block';
        }

        function closeAddCategoryModal() {
            document.getElementById('addCategoryModal').style.display = 'none';
            document.getElementById('addCategoryForm').reset();
        }

        document.getElementById('addCategoryForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('categoryName').value;
            const description = document.getElementById('categoryDescription').value;
            
            try {
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description })
                });
                
                if (response.ok) {
                    const newCategory = await response.json();
                    categories.push(newCategory);
                    displayCategories();
                    closeAddCategoryModal();
                    alert('Category added successfully!');
                } else {
                    alert('Error adding category');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding category');
            }
        });
    </script>
</body>
</html>
    `;
}

function getEmployeePage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Portal - The Resource Consultants</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #9C27B0, #8E24AA); }
        .tab-button { transition: all 0.3s ease; }
        .tab-button.active { background-color: #9C27B0; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body class="bg-gray-50">
    <header class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center">
                        <img src="/logo.png" alt="The Resource Consultants" class="h-8 w-auto mr-3">
                        <span class="text-xl font-bold">Employee Portal</span>
                    </div>
                </div>
                <nav class="flex space-x-8">
                    <a href="/" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Job Listings</a>
                    <a href="/admin" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Admin Portal</a>
                    <a href="/employee" class="text-white hover:text-purple-200 px-3 py-2 text-sm font-medium">Employee Portal</a>
                </nav>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Statistics Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Active Job Postings</p>
                        <p class="text-2xl font-bold text-gray-900">6</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Applications</p>
                        <p class="text-2xl font-bold text-gray-900">24</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Pending Reviews</p>
                        <p class="text-2xl font-bold text-gray-900">8</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-md">
            <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-6" aria-label="Tabs">
                    <button onclick="showTab('postings')" class="tab-button active py-4 px-1 border-b-2 border-purple-500 font-medium text-sm">
                        Job Postings
                    </button>
                    <button onclick="showTab('applications')" class="tab-button py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300">
                        Applications
                    </button>
                </nav>
            </div>

            <div id="postings" class="tab-content active p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-semibold">Job Postings Management</h2>
                    <button onclick="openCreateJobModal()" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200">
                        Create New Job
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">Senior Software Engineer</h3>
                                <p class="text-sm text-gray-600">Engineering • Full-time • Posted 5 days ago</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="text-purple-600 hover:text-purple-900 text-sm">Edit</button>
                                <button class="text-red-600 hover:text-red-900 text-sm">Delete</button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">Product Manager</h3>
                                <p class="text-sm text-gray-600">Product • Full-time • Posted 1 week ago</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="text-purple-600 hover:text-purple-900 text-sm">Edit</button>
                                <button class="text-red-600 hover:text-red-900 text-sm">Delete</button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="applications" class="tab-content p-6">
                <h2 class="text-xl font-semibold mb-6">Applications Management</h2>
                
                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">John Smith</h3>
                                <p class="text-sm text-gray-600">Applied for Senior Software Engineer</p>
                                <p class="text-xs text-gray-500">john.smith@email.com • Applied 2 days ago</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">Review</button>
                                <button class="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">Download Resume</button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending Review</span>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg border">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="font-medium text-gray-900">Sarah Johnson</h3>
                                <p class="text-sm text-gray-600">Applied for UX Designer</p>
                                <p class="text-xs text-gray-500">sarah.johnson@email.com • Applied 3 days ago</p>
                            </div>
                            <div class="flex space-x-2">
                                <button class="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">Review</button>
                                <button class="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400">Download Resume</button>
                            </div>
                        </div>
                        <div class="mt-2">
                            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Under Review</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
    </script>
</body>
</html>
    `;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Career Portal server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});