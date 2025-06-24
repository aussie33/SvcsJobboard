import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use(express.static(join(__dirname, 'dist')));

const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({ checkPeriod: 86400000 }),
  cookie: { maxAge: 86400000, secure: false, httpOnly: true, sameSite: 'lax' }
}));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const mapUser = (row) => ({
  id: row.id, username: row.username, password: row.password, email: row.email,
  firstName: row.first_name, lastName: row.last_name, fullName: row.full_name,
  role: row.role, department: row.department, isActive: row.is_active,
  isSuperAdmin: row.is_super_admin, createdAt: row.created_at, lastLogin: row.last_login
});

const mapJob = (row) => ({
  id: row.id, title: row.title, department: row.department, categoryId: row.category_id,
  employeeId: row.employee_id, shortDescription: row.short_description,
  fullDescription: row.full_description, requirements: row.requirements,
  type: row.type, location: row.location, salaryRange: row.salary_range,
  status: row.status, postedDate: row.posted_date, expiryDate: row.expiry_date
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    
    if (!user || user.password !== password || !user.isActive) {
      return res.status(403).json({ message: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    if (req.query.showAllStatuses !== 'true') {
      query += ' AND status = $1';
      params.push('active');
    }
    query += ' ORDER BY posted_date DESC';
    const result = await pool.query(query, params);
    const jobs = result.rows.map(row => ({ ...mapJob(row), tags: [] }));
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = userResult.rows[0] ? mapUser(userResult.rows[0]) : null;
    
    if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    const jobData = req.body.job || req.body;
    const query = `INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
    const values = [jobData.title, jobData.department, jobData.categoryId, user.id, jobData.shortDescription, jobData.fullDescription, jobData.requirements, jobData.type, jobData.location, jobData.salaryRange, jobData.status];
    
    const result = await pool.query(query, values);
    const job = { ...mapJob(result.rows[0]), tags: [] };
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories WHERE status = 'active' ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Career Portal running on port ${port}`));
