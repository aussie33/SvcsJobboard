const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;

// Copy logo file to server directory
const logoPath = path.join(__dirname, 'logo.png');
if (fs.existsSync('./attached_assets/base_logo_transparent_background copy_1752513603240.png')) {
    fs.copyFileSync('./attached_assets/base_logo_transparent_background copy_1752513603240.png', logoPath);
}

// Simple in-memory category storage
let categories = [
    { id: 1, name: 'Administrative', description: 'Administrative and office support roles', status: 'active' },
    { id: 2, name: 'Technology', description: 'Software development and IT positions', status: 'active' },
    { id: 3, name: 'Marketing', description: 'Marketing and communications roles', status: 'active' }
];

// Create the HTML content for admin portal
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
        .logo { display: flex; align-items: center; gap: 8px; color: #9333ea; font-weight: 600; cursor: pointer; }
        .logo img { height: 32px; width: auto; }
        .nav-tabs { display: flex; gap: 32px; }
        .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; cursor: pointer; }
        .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
        .nav-tab:hover { color: #9333ea; }
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
            <div class="logo" onclick="navigateToHome()">
                <img src="/logo.png" alt="The Resource Consultants" />
            </div>
            <div class="nav-tabs">
                <a href="#" class="nav-tab" onclick="navigateToJobListings()">Job Listings</a>
                <a href="#" class="nav-tab" onclick="navigateToEmployeePortal()">Employee Portal</a>
                <a href="#" class="nav-tab active">Admin Portal</a>
            </div>
            <div class="user-info">
                <span>Hello, Admin</span>
                <a href="#" class="logout-btn" onclick="logout()">Log off</a>
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
        
        // Navigation functions
        function navigateToHome() {
            window.location.href = '/';
        }
        
        function navigateToJobListings() {
            window.location.href = '/';
        }
        
        function navigateToEmployeePortal() {
            window.location.href = '/employee';
        }
        
        function logout() {
            // Clear any session data
            localStorage.clear();
            sessionStorage.clear();
            // Redirect to home page
            window.location.href = '/';
        }
    </script>
</body>
</html>
`;

// Create main job listings page
const homeHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Resource Consultants - Career Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f9fa; }
        
        .header { background: white; border-bottom: 1px solid #e5e7eb; padding: 12px 24px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; }
        .logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .logo img { height: 32px; width: auto; }
        .nav-tabs { display: flex; gap: 32px; }
        .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; cursor: pointer; }
        .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
        .nav-tab:hover { color: #9333ea; }
        .user-info { display: flex; align-items: center; gap: 16px; color: #6b7280; font-size: 14px; }
        .login-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 500; }
        .login-btn:hover { background: #7c3aed; }
        
        .hero { background: linear-gradient(135deg, #9C27B0 0%, #8E24AA 100%); color: white; padding: 80px 24px; text-align: center; }
        .hero h1 { font-size: 48px; font-weight: 700; margin-bottom: 16px; }
        .hero p { font-size: 20px; margin-bottom: 32px; opacity: 0.9; }
        .btn-primary { background: white; color: #9333ea; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-top: 32px; }
        .job-card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .job-title { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 12px; }
        .job-company { color: #6b7280; margin-bottom: 16px; }
        .job-description { color: #4b5563; margin-bottom: 16px; line-height: 1.5; }
        .job-badges { display: flex; gap: 8px; margin-bottom: 16px; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-type { background: #9333ea; color: white; }
        .badge-location { background: #f3f4f6; color: #6b7280; }
        .apply-btn { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; }
        .apply-btn:hover { background: #7c3aed; }
        
        /* Login Modal Styles */
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 8px; width: 90%; max-width: 400px; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-header h3 { margin: 0; color: #111827; font-size: 18px; font-weight: 600; }
        .close { color: #6b7280; font-size: 24px; cursor: pointer; }
        .close:hover { color: #111827; }
        .modal-body { padding: 24px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #374151; }
        .form-group input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
        .form-group input:focus { outline: none; border-color: #9333ea; }
        .modal-footer { padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .btn-cancel { background: #f3f4f6; color: #374151; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal { background: #9333ea; color: white; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; }
        .btn-primary-modal:hover { background: #7c3aed; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo" onclick="navigateToHome()">
                <img src="/logo.png" alt="The Resource Consultants" />
            </div>
            <div class="nav-tabs">
                <a href="#" class="nav-tab active">Job Listings</a>
                <!-- Employee Portal and Admin Portal tabs hidden for unauthenticated users -->
            </div>
            <div class="user-info">
                <button class="login-btn" onclick="showLogin()">Login</button>
            </div>
        </div>
    </div>
    
    <div class="hero">
        <h1>Find Your Dream Career</h1>
        <p>Connect with top employers and discover opportunities that match your skills</p>
        <button class="btn-primary" onclick="scrollToJobs()">Browse Jobs</button>
    </div>
    
    <div class="container">
        <div class="jobs-grid" id="jobsGrid">
            <!-- Jobs will be populated here -->
        </div>
    </div>
    
    <!-- Login Modal -->
    <div id="loginModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Login</h3>
                <span class="close" onclick="closeLogin()">&times;</span>
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
            const jobsGrid = document.getElementById('jobsGrid');
            const sampleJobs = [
                {
                    title: "Software Engineer",
                    company: "Tech Solutions Inc.",
                    description: "Join our dynamic team to build innovative software solutions. Work with cutting-edge technologies and collaborate with talented developers.",
                    type: "Full Time",
                    location: "Remote",
                    salary: "$80,000 - $120,000"
                },
                {
                    title: "Marketing Manager",
                    company: "Creative Agency",
                    description: "Lead marketing campaigns and drive brand awareness. Perfect opportunity for a creative professional to make an impact.",
                    type: "Full Time",
                    location: "New York, NY",
                    salary: "$60,000 - $80,000"
                },
                {
                    title: "UX Designer",
                    company: "Design Studio",
                    description: "Create beautiful and intuitive user experiences. Work with cross-functional teams to deliver exceptional digital products.",
                    type: "Contract",
                    location: "San Francisco, CA",
                    salary: "$70,000 - $90,000"
                }
            ];
            
            jobsGrid.innerHTML = sampleJobs.map(job => 
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
        }
        
        function navigateToHome() {
            window.location.href = '/';
        }
        
        function navigateToEmployeePortal() {
            window.location.href = '/employee';
        }
        
        function navigateToAdmin() {
            window.location.href = '/admin';
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
            
            // Mock authentication - in real app, this would be a proper API call
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
</html>
`;

// Employee portal page
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
        .logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .logo img { height: 32px; width: auto; }
        .nav-tabs { display: flex; gap: 32px; }
        .nav-tab { color: #6b7280; text-decoration: none; padding: 8px 0; border-bottom: 2px solid transparent; cursor: pointer; }
        .nav-tab.active { color: #9333ea; border-bottom-color: #9333ea; font-weight: 500; }
        .nav-tab:hover { color: #9333ea; }
        .user-info { display: flex; align-items: center; gap: 16px; color: #6b7280; font-size: 14px; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
        .page-title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 32px; }
        .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 24px; }
        .card-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px; }
        .btn-primary { background: #9333ea; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-primary:hover { background: #7c3aed; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="logo" onclick="navigateToHome()">
                <img src="/logo.png" alt="The Resource Consultants" />
            </div>
            <div class="nav-tabs">
                <a href="#" class="nav-tab" onclick="navigateToJobListings()">Job Listings</a>
                <a href="#" class="nav-tab active">Employee Portal</a>
                <a href="#" class="nav-tab" onclick="navigateToAdmin()">Admin Portal</a>
            </div>
            <div class="user-info">
                <span>Hello, Employee</span>
                <a href="#" onclick="logout()">Log off</a>
            </div>
        </div>
    </div>
    
    <div class="container">
        <h1 class="page-title">Employee Portal</h1>
        
        <div class="card">
            <div class="card-title">Job Management</div>
            <p>Create and manage job postings, review applications, and track hiring progress.</p>
            <button class="btn-primary" style="margin-top: 16px;">Create New Job</button>
        </div>
        
        <div class="card">
            <div class="card-title">Applications</div>
            <p>Review and manage job applications from candidates.</p>
            <button class="btn-primary" style="margin-top: 16px;">View Applications</button>
        </div>
        
        <div class="card">
            <div class="card-title">Reports</div>
            <p>Generate reports on hiring metrics and job performance.</p>
            <button class="btn-primary" style="margin-top: 16px;">View Reports</button>
        </div>
    </div>
    
    <script>
        function navigateToHome() {
            window.location.href = '/';
        }
        
        function navigateToJobListings() {
            window.location.href = '/';
        }
        
        function navigateToAdmin() {
            window.location.href = '/admin';
        }
        
        function logout() {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    </script>
</body>
</html>
`;

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/home') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(homeHTML);
    } else if (req.url === '/employee') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(employeeHTML);
    } else if (req.url === '/admin') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(adminHTML);
    } else if (req.url === '/logo.png') {
        try {
            const logoData = fs.readFileSync(logoPath);
            res.writeHead(200, { 'Content-Type': 'image/png' });
            res.end(logoData);
        } catch (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Logo not found');
        }
    } else if (req.url === '/api/categories' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(categories));
    } else if (req.url === '/api/categories' && req.method === 'POST') {
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
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Admin Portal server running on port ${PORT}`);
    console.log(`🌐 Access at: http://64.225.6.33/admin`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});