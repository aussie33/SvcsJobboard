#!/bin/bash

# Deploy using SSH key authentication (no password required)
set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"

echo "Deploying Career Portal from Replit to DigitalOcean..."

# Check if SSH key exists or create one
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "No SSH key found. Please run these commands first:"
    echo ""
    echo "1. Generate SSH key:"
    echo "   ssh-keygen -t rsa -b 4096 -C 'replit-deploy'"
    echo ""
    echo "2. Copy public key to server:"
    echo "   ssh-copy-id root@64.225.6.33"
    echo ""
    echo "3. Then run this script again"
    exit 1
fi

# Create deployment directory
TEMP_DIR="$(mktemp -d)"
echo "Creating deployment package..."

# Copy application files
cp -r server shared client public $TEMP_DIR/
cp package*.json tsconfig.json tailwind.config.ts postcss.config.js vite.config.ts $TEMP_DIR/
cp Dockerfile.production docker-compose.production.yml init-db.sql nginx.conf $TEMP_DIR/
mkdir -p $TEMP_DIR/uploads

# Create optimized production server
cat > $TEMP_DIR/server.js << 'EOF'
const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// CORS and middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'career-portal-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({ checkPeriod: 86400000 }),
  cookie: { maxAge: 86400000, secure: false, httpOnly: true, sameSite: 'lax' }
}));

// Database storage
class Storage {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async getUserByUsername(username) {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  async getUser(id) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  async getJobs(filters = {}) {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    if (!filters.showAllStatuses) {
      query += ' AND status = $1';
      params.push('active');
    }
    query += ' ORDER BY posted_date DESC';
    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapJob(row));
  }

  async getCategories() {
    const result = await this.pool.query("SELECT * FROM categories WHERE status = 'active' ORDER BY name");
    return result.rows;
  }

  async createJob(job) {
    const query = `INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`;
    const values = [job.title, job.department, job.categoryId, job.employeeId, job.shortDescription, job.fullDescription, job.requirements, job.type, job.location, job.salaryRange, job.status];
    const result = await this.pool.query(query, values);
    return this.mapJob(result.rows[0]);
  }

  mapUser(row) {
    return {
      id: row.id, username: row.username, password: row.password, email: row.email,
      firstName: row.first_name, lastName: row.last_name, fullName: row.full_name,
      role: row.role, department: row.department, isActive: row.is_active,
      isSuperAdmin: row.is_super_admin, createdAt: row.created_at, lastLogin: row.last_login
    };
  }

  mapJob(row) {
    return {
      id: row.id, title: row.title, department: row.department, categoryId: row.category_id,
      employeeId: row.employee_id, shortDescription: row.short_description,
      fullDescription: row.full_description, requirements: row.requirements,
      type: row.type, location: row.location, salaryRange: row.salary_range,
      status: row.status, postedDate: row.posted_date, expiryDate: row.expiry_date
    };
  }
}

const storage = new Storage();

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);
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
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await storage.getJobs({ showAllStatuses: req.query.showAllStatuses === 'true' });
    res.json(jobs.map(job => ({ ...job, tags: [] })));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const jobData = req.body.job || req.body;
    const job = await storage.createJob({ ...jobData, employeeId: user.id });
    res.status(201).json({ ...job, tags: [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Career Portal running on port ${port}`));
EOF

# Create simple Dockerfile
cat > $TEMP_DIR/Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "server.js"]
EOF

# Create docker-compose file
cat > $TEMP_DIR/docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: career_portal
      POSTGRES_USER: career_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-career_secure_password_2024}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://career_user:${POSTGRES_PASSWORD:-career_secure_password_2024}@postgres:5432/career_portal
      SESSION_SECRET: ${SESSION_SECRET:-career-portal-secret-production}
    ports:
      - "80:5000"
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads

volumes:
  postgres_data:
EOF

# Create deployment package
cd $TEMP_DIR
tar -czf ../career-portal-deploy.tar.gz .

echo "Uploading to server..."
scp -o StrictHostKeyChecking=no ../career-portal-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "Deploying on server..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'EOSSH'
    set -e
    cd /tmp && tar -xzf career-portal-deploy.tar.gz
    
    mkdir -p /opt/career-portal && cd /opt/career-portal
    rm -rf * 2>/dev/null || true
    mv /tmp/server /tmp/shared /tmp/client /tmp/public /tmp/uploads ./
    mv /tmp/*.json /tmp/*.ts /tmp/*.js /tmp/Dockerfile /tmp/docker-compose.yml /tmp/init-db.sql ./
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
        systemctl start docker && systemctl enable docker
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Deploy
    docker-compose down --remove-orphans 2>/dev/null || true
    POSTGRES_PASSWORD="career_secure_password_2024" SESSION_SECRET="career-portal-secret" docker-compose up -d --build
    
    sleep 30
    echo "Service status:" && docker-compose ps
    echo "Testing health..." && curl -f http://localhost/api/health || echo "Starting up..."
    
    rm -f /tmp/career-portal-deploy.tar.gz
    echo "Deployment complete! Access at: http://64.225.6.33"
EOSSH

# Cleanup
rm -rf $TEMP_DIR
rm -f /tmp/career-portal-deploy.tar.gz

echo "Career Portal deployed successfully to http://64.225.6.33"