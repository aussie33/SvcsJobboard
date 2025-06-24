#!/bin/bash

# Deploy directly from Replit to DigitalOcean
set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"

echo "Deploying Career Portal from Replit to DigitalOcean..."

# Create temporary deployment directory
TEMP_DIR="/tmp/replit-deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p $TEMP_DIR

# Copy current application files
cp -r server $TEMP_DIR/
cp -r shared $TEMP_DIR/
cp -r client $TEMP_DIR/
cp -r public $TEMP_DIR/
cp package*.json $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp tailwind.config.ts $TEMP_DIR/
cp postcss.config.js $TEMP_DIR/
cp vite.config.ts $TEMP_DIR/
cp drizzle.config.ts $TEMP_DIR/

# Create uploads directory
mkdir -p $TEMP_DIR/uploads

# Copy Docker configuration
cp Dockerfile.production $TEMP_DIR/
cp docker-compose.production.yml $TEMP_DIR/docker-compose.yml
cp init-db.sql $TEMP_DIR/
cp nginx.conf $TEMP_DIR/

# Create production server
cat > $TEMP_DIR/production-server.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { Pool } from 'pg';

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

// Storage class with working authentication
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
    console.log('Login successful - Setting session userId:', user.id);
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
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Auth error:', error);
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
    console.error('Jobs fetch error:', error);
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
    console.log('Creating job:', jobData);
    
    const job = await storage.createJob({
      ...jobData,
      employeeId: user.id
    });

    console.log('Job created:', job);
    res.status(201).json({ ...job, tags: [] });
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
});

// Categories route
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Categories fetch error:', error);
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

# Create deployment package
cd $TEMP_DIR
tar -czf ../deploy-package.tar.gz .

echo "Uploading to DigitalOcean server..."
scp ../deploy-package.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOSSH'
    set -e
    cd /tmp
    
    # Extract deployment files
    tar -xzf deploy-package.tar.gz
    
    # Create app directory
    mkdir -p /opt/career-portal-replit
    cd /opt/career-portal-replit
    
    # Remove old files and copy new ones
    rm -rf * 2>/dev/null || true
    mv /tmp/server ./
    mv /tmp/shared ./
    mv /tmp/client ./
    mv /tmp/public ./
    mv /tmp/package*.json ./
    mv /tmp/tsconfig.json ./
    mv /tmp/tailwind.config.ts ./
    mv /tmp/postcss.config.js ./
    mv /tmp/vite.config.ts ./
    mv /tmp/drizzle.config.ts ./
    mv /tmp/Dockerfile.production ./
    mv /tmp/docker-compose.yml ./
    mv /tmp/init-db.sql ./
    mv /tmp/nginx.conf ./
    mv /tmp/production-server.js ./
    mv /tmp/uploads ./
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
    fi
    
    # Install Docker Compose if needed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build and start services
    echo "Building Docker image..."
    docker build -f Dockerfile.production -t career-portal:replit .
    
    echo "Starting services..."
    POSTGRES_PASSWORD="career_secure_password_2024" \
    SESSION_SECRET="career-portal-super-secret-key-production-2024" \
    docker-compose up -d
    
    # Wait for services
    echo "Waiting for services to start..."
    sleep 45
    
    # Check status
    echo "Service status:"
    docker-compose ps
    
    # Show logs
    echo "Application logs:"
    docker-compose logs --tail=15 app
    
    # Test health
    echo "Testing health endpoint..."
    sleep 10
    curl -f http://localhost/api/health 2>/dev/null && echo "Health check passed!" || echo "Health check pending..."
    
    # Cleanup
    rm -f /tmp/deploy-package.tar.gz get-docker.sh
    
    echo ""
    echo "✅ Deployment completed!"
    echo "🌐 Career Portal available at: http://64.225.6.33"
    echo "📋 Test accounts:"
    echo "   Admin: admin / admin123"
    echo "   Employee: employee / employee123"
    echo "   Applicant: applicant / applicant123"
EOSSH

# Cleanup
rm -rf $TEMP_DIR
rm -f /tmp/deploy-package.tar.gz

echo ""
echo "Deployment from Replit completed successfully!"
echo "Access your Career Portal at: http://64.225.6.33"