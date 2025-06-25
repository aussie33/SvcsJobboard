#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Creating instant deployment package...');

// Create deployment directory
const deployDir = 'instant-deploy';
if (fs.existsSync(deployDir)) {
  execSync(`rm -rf ${deployDir}`);
}
fs.mkdirSync(deployDir);

// Copy application files
console.log('Copying application files...');
execSync(`cp -r server shared client public ${deployDir}/`);
execSync(`cp package*.json tsconfig.json tailwind.config.ts postcss.config.js vite.config.ts ${deployDir}/`);
execSync(`cp init-db.sql ${deployDir}/`);
execSync(`mkdir -p ${deployDir}/uploads`);

// Create production server
const productionServer = `const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-production-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({ checkPeriod: 86400000 }),
  cookie: { maxAge: 86400000, secure: false, httpOnly: true, sameSite: 'lax' }
}));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });

const mapUser = (row) => ({
  id: row.id, username: row.username, password: row.password, email: row.email,
  firstName: row.first_name, lastName: row.last_name, middleName: row.middle_name,
  preferredName: row.preferred_name, fullName: row.full_name, role: row.role,
  department: row.department, isActive: row.is_active, isSuperAdmin: row.is_super_admin,
  createdAt: row.created_at, lastLogin: row.last_login
});

const mapJob = (row) => ({
  id: row.id, title: row.title, department: row.department, categoryId: row.category_id,
  employeeId: row.employee_id, shortDescription: row.short_description,
  fullDescription: row.full_description, requirements: row.requirements,
  type: row.type, location: row.location, city: row.city, state: row.state,
  salaryRange: row.salary_range, status: row.status, postedDate: row.posted_date,
  expiryDate: row.expiry_date
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: 'production', version: '1.0.0' }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    
    if (!user || user.password !== password || !user.isActive) {
      console.log('Login failed for:', username);
      return res.status(403).json({ message: 'Invalid credentials' });
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
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0] ? mapUser(result.rows[0]) : null;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.json({ message: 'Logged out successfully' });
  });
});

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
    res.json(result.rows.map(row => ({ ...mapJob(row), tags: [] })));
  } catch (error) {
    console.error('Jobs fetch error:', error);
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
    console.log('Creating job:', jobData);
    
    const query = \`INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *\`;
    const values = [jobData.title, jobData.department, jobData.categoryId, user.id, jobData.shortDescription, jobData.fullDescription, jobData.requirements, jobData.type, jobData.location, jobData.salaryRange, jobData.status];
    
    const result = await pool.query(query, values);
    const job = { ...mapJob(result.rows[0]), tags: [] };
    console.log('Job created:', job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories WHERE status = 'active' ORDER BY name");
    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, '0.0.0.0', () => {
  console.log(\`Career Portal server running on port \${port}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'production'}\`);
});`;

fs.writeFileSync(`${deployDir}/server.js`, productionServer);

// Create package.json
const packageJson = {
  "name": "career-portal",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "memorystore": "^1.6.7",
    "pg": "^8.11.3",
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.3"
  }
};

fs.writeFileSync(`${deployDir}/package.json`, JSON.stringify(packageJson, null, 2));

// Create Dockerfile
const dockerfile = `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]`;

fs.writeFileSync(`${deployDir}/Dockerfile`, dockerfile);

// Create docker-compose.yml
const dockerCompose = `version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: career_portal
      POSTGRES_USER: career_user
      POSTGRES_PASSWORD: career_secure_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U career_user -d career_portal"]
      interval: 30s
      timeout: 10s
      retries: 5
  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://career_user:career_secure_password_2024@postgres:5432/career_portal
      SESSION_SECRET: career-portal-super-secret-key-production-2024
    ports:
      - "80:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
volumes:
  postgres_data:`;

fs.writeFileSync(`${deployDir}/docker-compose.yml`, dockerCompose);

// Create deployment package
process.chdir(deployDir);
execSync('tar -czf ../career-portal-instant.tar.gz *');
process.chdir('..');

console.log('Deployment package created: career-portal-instant.tar.gz');
console.log('Size:', execSync('ls -lh career-portal-instant.tar.gz').toString().trim());

// Create deployment commands
const deployCommands = `
# Upload to server:
scp career-portal-instant.tar.gz root@64.225.6.33:/tmp/

# SSH to server and run:
ssh root@64.225.6.33

# On server, run these commands:
cd /tmp && tar -xzf career-portal-instant.tar.gz
mkdir -p /opt/career-portal-instant && cd /opt/career-portal-instant
rm -rf * 2>/dev/null || true
mv /tmp/server /tmp/shared /tmp/client /tmp/public /tmp/uploads .
mv /tmp/*.json /tmp/*.js /tmp/Dockerfile /tmp/docker-compose.yml /tmp/init-db.sql .

# Install Docker if needed
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker && systemctl enable docker
fi

# Install Docker Compose if needed  
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Deploy
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up -d --build

# Check status
sleep 30 && docker-compose ps
curl -f http://localhost/api/health && echo "Deployment successful!"

# Access at: http://64.225.6.33
# Login: admin/admin123, employee/employee123, applicant/applicant123
`;

fs.writeFileSync('DEPLOY_INSTRUCTIONS.md', deployCommands);

console.log('\nDeployment ready!');
console.log('1. Run the upload command from DEPLOY_INSTRUCTIONS.md');
console.log('2. SSH to your server and run the deployment commands');
console.log('3. Your Career Portal will be available at http://64.225.6.33');

// Cleanup
execSync(`rm -rf ${deployDir}`);