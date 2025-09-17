# Environment Setup Guide - Career Portal

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / macOS 10.15+ / Windows 10 with WSL2
- **Node.js**: 20.18.1+ (LTS recommended)  
- **PostgreSQL**: 14+ (16+ recommended)
- **Memory**: 2GB RAM minimum, 4GB recommended
- **Storage**: 1GB free space for application + database

### Recommended Production Requirements
- **OS**: Ubuntu 22.04+ LTS
- **Node.js**: 20.18.1 LTS
- **PostgreSQL**: 16+
- **Memory**: 4GB+ RAM
- **Storage**: 20GB+ SSD
- **Network**: 100Mbps+ connection

---

## Development Environment Setup

### 1. Node.js Installation

#### Ubuntu/Debian
```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.18.1+
npm --version   # Should show 10.2.4+
```

#### macOS
```bash
# Using Homebrew
brew install node@20

# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

#### Windows (WSL2)
```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use Windows Package Manager
winget install OpenJS.NodeJS
```

### 2. PostgreSQL Installation

#### Ubuntu/Debian
```bash
# Install PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-client-16

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres psql
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Using Postgres.app (GUI option)
# Download from https://postgresapp.com/
```

#### Windows
```bash
# Download installer from https://www.postgresql.org/download/windows/
# Or use Docker
docker run --name postgres-career-portal \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Database Setup
```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Create database and user
CREATE DATABASE career_portal_db;
CREATE USER career_portal_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE career_portal_db TO career_portal_user;
GRANT ALL ON SCHEMA public TO career_portal_user;

-- Test connection
\c career_portal_db
\q
```

### 4. Project Setup
```bash
# Clone repository
git clone https://github.com/aussie33/SvcsJobboard.git
cd SvcsJobboard

# Install dependencies
npm install

# Install critical security packages
npm install bcrypt @types/bcrypt

# Verify bcrypt installation
npm list bcrypt
```

---

## Environment Variables Configuration

### 1. Create Environment File
```bash
# Create .env file in project root
cp .env.example .env

# Edit environment variables
nano .env
```

### 2. Required Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://career_portal_user:your_secure_password@localhost:5432/career_portal_db
PGHOST=localhost
PGPORT=5432
PGDATABASE=career_portal_db
PGUSER=career_portal_user
PGPASSWORD=your_secure_password

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Configuration
SESSION_SECRET=generate-32-character-random-string-here

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Environment Variable Generation
```bash
# Generate secure session secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://randomkeygen.com/
```

---

## Package Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@neondatabase/serverless": "^0.10.4",
    "@radix-ui/react-*": "various versions",
    "@tanstack/react-query": "^5.60.5",
    "bcrypt": "latest",
    "@types/bcrypt": "latest",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.16.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.1",
    "tailwindcss": "^3.4.14",
    "wouter": "^3.3.5",
    "zod": "^3.23.8"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@types/express": "4.17.21",
    "@types/express-session": "^1.18.0",
    "@types/multer": "^1.4.12",
    "@types/node": "20.16.11",
    "@types/pg": "^8.15.4",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.2",
    "drizzle-kit": "^0.30.4",
    "tsx": "^4.19.1",
    "typescript": "5.6.3",
    "vite": "^5.4.14"
  }
}
```

### Installation Commands
```bash
# Install all dependencies
npm install

# Install production dependencies only
npm install --production

# Install development dependencies
npm install --save-dev

# Update all dependencies
npm update
```

---

## Database Schema Setup

### 1. Initialize Database
```bash
# Push schema to database
npm run db:push --force

# Verify tables created
psql -h localhost -U career_portal_user -d career_portal_db -c "\dt"
```

### 2. Database Commands
```bash
# Generate migration files
npm run db:generate

# Push changes to database
npm run db:push

# View current schema
npm run db:studio  # Opens Drizzle Studio
```

### 3. Sample Data Verification
```sql
-- Connect to database
psql -h localhost -U career_portal_user career_portal_db

-- Check users (should show 3+ users with bcrypt hashes)
SELECT id, username, email, role, 
       CASE WHEN password LIKE '$2b$%' THEN 'bcrypt_hash' ELSE 'plaintext' END as password_type
FROM users;

-- Check categories (should show ~13 categories)
SELECT COUNT(*) as category_count FROM categories;

-- Check jobs
SELECT id, title, status, department FROM jobs;

-- Exit
\q
```

---

## Development Tools Setup

### 1. Code Editor (VS Code Recommended)
```bash
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json

# Configure VS Code settings
mkdir -p .vscode
cat > .vscode/settings.json << EOF
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    "cva\\\\(([^)]*)\\\\)",
    "cx\\\\(([^)]*)\\\\)"
  ]
}
EOF
```

### 2. Git Configuration
```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up GitHub repository connection
git remote add origin https://github.com/aussie33/SvcsJobboard.git
git branch -M main
```

### 3. Process Manager (Production)
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'career-portal',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF
```

---

## Build and Run Commands

### Development Mode
```bash
# Start development server with hot reload
npm run dev

# Start with specific port
PORT=3000 npm run dev

# Start with database logging
DEBUG=drizzle:query npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm run start

# Start with PM2
pm2 start ecosystem.config.js --env production
```

### Database Operations
```bash
# Push schema changes
npm run db:push

# Generate schema migrations
npm run db:generate

# View database in browser
npm run db:studio
```

### Testing and Validation
```bash
# Type checking
npm run check

# Test database connection
node -e "const { db } = require('./server/postgres-storage'); console.log('DB connected');"

# Test bcrypt installation
node -e "const bcrypt = require('bcrypt'); console.log('bcrypt working:', bcrypt.hashSync('test', 10));"
```

---

## Environment Verification

### 1. System Health Check
```bash
# Check Node.js version
node --version

# Check npm version  
npm --version

# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -h localhost -U career_portal_user -d career_portal_db -c "SELECT version();"

# Check bcrypt installation
npm list bcrypt
```

### 2. Application Health Check
```bash
# Start development server
npm run dev

# Test endpoints (in another terminal)
curl http://localhost:5000/api/health
curl http://localhost:5000/api/categories
curl http://localhost:5000/api/jobs

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. File Upload Test
```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Test file upload endpoint (requires authentication)
# Upload a test PDF file through the web interface
```

---

## Troubleshooting Common Issues

### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install

# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
```

### Database Issues
```bash
# Reset PostgreSQL password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### bcrypt Installation Issues
```bash
# Install build tools (Ubuntu)
sudo apt install build-essential python3-dev

# Install bcrypt with rebuild
npm rebuild bcrypt

# Alternative: use bcryptjs (pure JavaScript)
npm uninstall bcrypt
npm install bcryptjs @types/bcryptjs
```

### Session Issues
```bash
# Clear browser cookies
# Check session secret is set in .env
# Restart development server
# Verify session middleware is loaded
```

---

## Production Environment Considerations

### 1. Performance Optimization
```env
# Production environment variables
NODE_ENV=production
PORT=5000
SESSION_SECRET=production-32-char-secret
DATABASE_URL=postgresql://user:pass@localhost:5432/career_portal_prod
```

### 2. Security Configuration
```bash
# Set secure file permissions
chmod 600 .env
chmod -R 755 uploads/

# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Monitoring Setup
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-logrotate

# Set up log rotation
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

**Setup Complete! 🎉**

Your Career Portal development environment is now ready. Run `npm run dev` to start developing!

For production deployment, see `DEPLOYMENT_GUIDE.md`.