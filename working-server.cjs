const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;

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
                <a href="#" class="nav-tab">Job Listings</a>
                <a href="#" class="nav-tab">Employee Portal</a>
                <a href="#" class="nav-tab active">Admin Portal</a>
            </div>
            <div class="user-info">
                <span>Hello, Admin</span>
                <a href="#" class="logout-btn">Log off</a>
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
    if (req.url === '/admin') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(adminHTML);
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