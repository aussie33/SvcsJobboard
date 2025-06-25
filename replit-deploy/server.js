const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// Session configuration (exact match with Replit)
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-production-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({ checkPeriod: 86400000 }),
  cookie: { 
    maxAge: 86400000, 
    secure: false, 
    httpOnly: true, 
    sameSite: 'lax' 
  }
}));

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Helper functions (exact match with working Replit version)
const mapUser = (row) => ({
  id: row.id,
  username: row.username,
  password: row.password,
  email: row.email,
  firstName: row.first_name,
  lastName: row.last_name,
  middleName: row.middle_name,
  preferredName: row.preferred_name,
  fullName: row.full_name,
  role: row.role,
  department: row.department,
  isActive: row.is_active,
  isSuperAdmin: row.is_super_admin,
  createdAt: row.created_at,
  lastLogin: row.last_login
});

const mapJob = (row) => ({
  id: row.id,
  title: row.title,
  department: row.department,
  categoryId: row.category_id,
  employeeId: row.employee_id,
  shortDescription: row.short_description,
  fullDescription: row.full_description,
  requirements: row.requirements,
  type: row.type,
  location: row.location,
  city: row.city,
  state: row.state,
  salaryRange: row.salary_range,
  status: row.status,
  postedDate: row.posted_date,
  expiryDate: row.expiry_date
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production',
    version: '1.0.0'
  });
});

// Authentication routes (exact working implementation)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);
    
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(403).json({ message: 'Invalid credentials' });
    }
    
    if (user.password !== password) {
      console.log('Password mismatch for:', username);
      return res.status(403).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      console.log('Account disabled for:', username);
      return res.status(403).json({ message: 'Account is disabled' });
    }
    
    req.session.userId = user.id;
    console.log('Login successful for:', username, 'userId:', user.id);
    res.json(user);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Jobs routes
app.get('/api/jobs', async (req, res) => {
  try {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    
    if (req.query.status && req.query.status !== 'all') {
      query += ' AND status = $1';
      params.push(req.query.status);
    } else if (req.query.showAllStatuses !== 'true') {
      query += ' AND status = $1';
      params.push('active');
    }
    
    query += ' ORDER BY posted_date DESC';
    const result = await pool.query(query, params);
    const jobs = result.rows.map(row => ({ ...mapJob(row), tags: [] }));
    res.json(jobs);
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = userResult.rows[0] ? mapUser(userResult.rows[0]) : null;
    
    if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const jobData = req.body.job || req.body;
    console.log('Creating job:', jobData);
    
    const query = `
      INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      jobData.title,
      jobData.department,
      jobData.categoryId,
      user.id,
      jobData.shortDescription,
      jobData.fullDescription,
      jobData.requirements,
      jobData.type,
      jobData.location,
      jobData.salaryRange,
      jobData.status
    ];
    
    const result = await pool.query(query, values);
    const job = { ...mapJob(result.rows[0]), tags: [] };
    console.log('Job created:', job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Categories route
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories WHERE status = 'active' ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Career Portal server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});
