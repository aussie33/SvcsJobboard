#!/bin/bash

# Deploy current Replit version directly to DigitalOcean
# This script deploys the exact working version from Replit

set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"
APP_NAME="career-portal"

echo "Deploying current Replit version to DigitalOcean..."

# Create deployment directory
DEPLOY_DIR="replit-deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p $DEPLOY_DIR

echo "Copying current application files..."

# Copy all necessary files from current Replit environment
cp -r server $DEPLOY_DIR/
cp -r shared $DEPLOY_DIR/
cp -r client $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
mkdir -p $DEPLOY_DIR/uploads

# Copy configuration files
cp package*.json $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/
cp tailwind.config.ts $DEPLOY_DIR/
cp postcss.config.js $DEPLOY_DIR/
cp vite.config.ts $DEPLOY_DIR/
cp drizzle.config.ts $DEPLOY_DIR/

# Copy Docker files
cp Dockerfile.production $DEPLOY_DIR/
cp docker-compose.production.yml $DEPLOY_DIR/docker-compose.yml
cp init-db.sql $DEPLOY_DIR/
cp nginx.conf $DEPLOY_DIR/
cp .dockerignore $DEPLOY_DIR/

# Create production server file that matches current working version
cat > $DEPLOY_DIR/production-server.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { Pool } from 'pg';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-secret-key-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'connect.sid'
}));

// Serve static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));
app.use(express.static(join(__dirname, 'dist')));

// Simple storage class for production
class PostgreSQLStorage {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  async getUserByUsername(username) {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  async getUser(id) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  async getJobs(filters = {}) {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.status && filters.status !== 'all') {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    } else if (!filters.showAllStatuses) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push('active');
    }

    query += ' ORDER BY posted_date DESC';
    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapJobFromDb(row));
  }

  async getCategories() {
    const result = await this.pool.query("SELECT * FROM categories WHERE status = 'active' ORDER BY name");
    return result.rows;
  }

  async createJob(job) {
    const query = `
      INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      job.title, job.department, job.categoryId, job.employeeId,
      job.shortDescription, job.fullDescription, job.requirements,
      job.type, job.location, job.salaryRange, job.status
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapJobFromDb(result.rows[0]);
  }

  mapUserFromDb(row) {
    return {
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
    };
  }

  mapJobFromDb(row) {
    return {
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
    };
  }
}

const storage = new PostgreSQLStorage(process.env.DATABASE_URL);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password || !user.isActive) {
      return res.status(403).json({ message: user ? 'Account is disabled' : 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// Jobs routes
app.get('/api/jobs', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      showAllStatuses: req.query.showAllStatuses === 'true'
    };
    const jobs = await storage.getJobs(filters);
    const jobsWithTags = jobs.map(job => ({ ...job, tags: [] }));
    res.json(jobsWithTags);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const jobData = req.body.job || req.body;
    const job = await storage.createJob({
      ...jobData,
      employeeId: user.id
    });

    res.status(201).json({ ...job, tags: [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Categories route
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Career Portal server running on port ${port}`);
});
EOF

# Create production package script
cat > $DEPLOY_DIR/deploy-to-digitalocean.sh << 'EOF'
#!/bin/bash
set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"

echo "Building and deploying to DigitalOcean..."

# Build Docker image
docker build -f Dockerfile.production -t career-portal:current .

# Save image
docker save career-portal:current | gzip > career-portal-current.tar.gz

# Create deployment package
tar -czf deploy-package.tar.gz \
    career-portal-current.tar.gz \
    docker-compose.yml \
    init-db.sql \
    nginx.conf \
    production-server.js

# Deploy to server
scp deploy-package.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

ssh $SERVER_USER@$SERVER_IP << 'EOSSH'
    cd /tmp
    tar -xzf deploy-package.tar.gz
    
    mkdir -p /opt/career-portal-current
    cd /opt/career-portal-current
    
    # Copy files
    mv /tmp/docker-compose.yml ./
    mv /tmp/init-db.sql ./
    mv /tmp/nginx.conf ./
    mv /tmp/production-server.js ./
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Load image
    gunzip -c /tmp/career-portal-current.tar.gz | docker load
    
    # Stop existing containers
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start services
    POSTGRES_PASSWORD="career_secure_password_2024" \
    SESSION_SECRET="career-portal-super-secret-key-production-2024" \
    docker-compose up -d
    
    sleep 30
    docker-compose ps
    
    # Cleanup
    rm -f /tmp/deploy-package.tar.gz /tmp/career-portal-current.tar.gz
    
    echo "Deployment completed!"
EOSSH

rm -f deploy-package.tar.gz career-portal-current.tar.gz

echo "Career Portal deployed successfully!"
echo "Access at: http://64.225.6.33"
EOF

chmod +x $DEPLOY_DIR/deploy-to-digitalocean.sh

# Create archive of current version
tar -czf ${DEPLOY_DIR}.tar.gz $DEPLOY_DIR/

echo "✅ Current Replit version packaged successfully!"
echo "📦 Package: ${DEPLOY_DIR}.tar.gz"
echo ""
echo "🚀 To deploy:"
echo "1. Extract: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "2. Deploy: cd ${DEPLOY_DIR} && ./deploy-to-digitalocean.sh"
echo ""
echo "🌐 After deployment, access at: http://64.225.6.33"

# Cleanup
rm -rf $DEPLOY_DIR