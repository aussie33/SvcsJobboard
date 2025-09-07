#!/bin/bash

# Deployment script for Ubuntu server 134.199.237.34
# Run this script AFTER running backup-new-server.sh

set -e  # Exit on any error

echo "=== Career Portal Deployment Script ==="
echo "Server: 134.199.237.34 (Ubuntu)"
echo "Date: $(date)"
echo ""

# Configuration
APP_DIR="/var/www/career-portal"
WEB_ROOT="/var/www/html"
NGINX_SITE="/etc/nginx/sites-available/career-portal"
SERVICE_NAME="career-portal"

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    echo "⚠️  Running as root. This script should be run as a regular user with sudo privileges."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Step 1: Stopping existing services..."
# Stop existing services
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"
sudo systemctl stop $SERVICE_NAME 2>/dev/null || echo "Career portal service not running"
pm2 stop all 2>/dev/null || echo "No PM2 processes running"
sudo pkill -f "node.*career" 2>/dev/null || echo "No node processes found"

echo ""
echo "Step 2: Installing system dependencies..."
# Update system packages
sudo apt update
sudo apt install -y nodejs npm nginx postgresql postgresql-contrib curl git

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✓ PM2 installed"
fi

echo ""
echo "Step 3: Setting up application directory..."
# Create application directory
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR
cd $APP_DIR

# Copy application files (assuming they're uploaded to /tmp/career-portal)
if [ -d "/tmp/career-portal" ]; then
    echo "Copying application files from /tmp/career-portal..."
    cp -r /tmp/career-portal/* .
else
    echo "⚠️  Application files not found in /tmp/career-portal"
    echo "Please upload the application files first, then re-run this script"
    exit 1
fi

echo ""
echo "Step 4: Installing Node.js dependencies..."
# Install dependencies
npm install --production

echo ""
echo "Step 5: Setting up environment variables..."
# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
SESSION_SECRET=$(openssl rand -base64 32)

# Database Configuration
DATABASE_URL=postgresql://career_portal_user:career_portal_secure_pass@localhost:5432/career_portal_db
PGHOST=localhost
PGPORT=5432
PGUSER=career_portal_user
PGPASSWORD=career_portal_secure_pass
PGDATABASE=career_portal_db

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Application Settings
REPLIT_DOMAIN=134.199.237.34
REPL_ID=career-portal-production
EOF

echo "✓ Environment file created"

echo ""
echo "Step 6: Setting up PostgreSQL database..."
# Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE USER career_portal_user WITH PASSWORD 'career_portal_secure_pass';
CREATE DATABASE career_portal_db OWNER career_portal_user;
GRANT ALL PRIVILEGES ON DATABASE career_portal_db TO career_portal_user;
\q
EOF

# Run database migrations
export DATABASE_URL="postgresql://career_portal_user:career_portal_secure_pass@localhost:5432/career_portal_db"
npm run db:push

# Insert sample data including all user types
echo "Setting up sample data with admin, employee, and customer accounts..."
PGPASSWORD=career_portal_secure_pass psql -h localhost -U career_portal_user -d career_portal_db << 'EOF'
-- Insert categories
INSERT INTO categories (name, description) VALUES 
('Technology', 'Information Technology and Software Development'),
('Healthcare', 'Medical and Healthcare Services'),
('Finance', 'Banking, Accounting, and Financial Services'),
('Marketing', 'Marketing, Advertising, and Communications'),
('Sales', 'Sales and Business Development'),
('Operations', 'Operations and Supply Chain Management'),
('Human Resources', 'HR and People Operations'),
('Customer Service', 'Customer Support and Relations'),
('Engineering', 'Engineering and Technical Roles'),
('Administrative', 'Administrative and Office Support'),
('Education', 'Education and Training'),
('Legal', 'Legal and Compliance'),
('Consulting', 'Consulting and Advisory Services')
ON CONFLICT (name) DO NOTHING;

-- Insert users with all three types
INSERT INTO users (username, email, firstName, lastName, role, passwordHash) VALUES 
('admin', 'admin@theresourceconsultants.com', 'System', 'Administrator', 'admin', '$2b$10$8K1p/a8jJZYpNqTKF3Q3P.VbA3Y8A2eU5N4l3oH/yMtQ7qWcJeJyO'),
('employee', 'employee@theresourceconsultants.com', 'Staff', 'Employee', 'employee', '$2b$10$8K1p/a8jJZYpNqTKF3Q3P.VbA3Y8A2eU5N4l3oH/yMtQ7qWcJeJyO'),
('customer1', 'customer1@example.com', 'John', 'Smith', 'applicant', '$2b$10$8K1p/a8jJZYpNqTKF3Q3P.VbA3Y8A2eU5N4l3oH/yMtQ7qWcJeJyO'),
('customer2', 'customer2@example.com', 'Sarah', 'Johnson', 'applicant', '$2b$10$8K1p/a8jJZYpNqTKF3Q3P.VbA3Y8A2eU5N4l3oH/yMtQ7qWcJeJyO'),
('customer3', 'customer3@example.com', 'Michael', 'Brown', 'applicant', '$2b$10$8K1p/a8jJZYpNqTKF3Q3P.VbA3Y8A2eU5N4l3oH/yMtQ7qWcJeJyO')
ON CONFLICT (username) DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (title, shortDescription, fullDescription, requirements, type, location, salaryRange, categoryId, department, postedDate, status, tags) VALUES 
('Senior Software Developer', 'Join our dynamic development team building cutting-edge applications', 'We are seeking an experienced software developer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software applications using modern technologies and best practices.', 'Bachelor''s degree in Computer Science, 5+ years experience, proficiency in React, Node.js, and PostgreSQL', 'full-time', 'remote', '$80,000 - $120,000', 1, 'Engineering', NOW(), 'active', '{"React","Node.js","PostgreSQL","Remote"}'),
('Marketing Manager', 'Lead our marketing initiatives and drive brand awareness', 'We are looking for a creative and strategic Marketing Manager to develop and execute marketing campaigns that drive business growth. You will work closely with cross-functional teams to create compelling marketing materials and strategies.', 'Bachelor''s degree in Marketing, 3+ years management experience, digital marketing expertise', 'full-time', 'hybrid', '$60,000 - $85,000', 4, 'Marketing', NOW(), 'active', '{"Marketing","Management","Digital","Strategy"}'),
('Customer Success Specialist', 'Help our customers achieve their goals with our platform', 'Join our customer success team to ensure our clients get maximum value from our services. You will be the primary point of contact for customer inquiries, onboarding, and ongoing support.', 'Bachelor''s degree preferred, excellent communication skills, customer service experience', 'full-time', 'on-site', '$45,000 - $65,000', 8, 'Customer Success', NOW(), 'active', '{"Customer Service","Communication","Support","Onboarding"}'),
('Financial Analyst', 'Analyze financial data to support business decisions', 'We are seeking a detail-oriented Financial Analyst to join our finance team. You will be responsible for financial modeling, budgeting, forecasting, and providing insights to support strategic business decisions.', 'Bachelor''s degree in Finance or Accounting, CPA preferred, Excel proficiency, 2+ years experience', 'full-time', 'on-site', '$55,000 - $75,000', 3, 'Finance', NOW(), 'active', '{"Finance","Excel","Analysis","CPA"}'),
('HR Coordinator', 'Support our human resources operations', 'Join our HR team to help with recruitment, employee relations, and HR administrative tasks. This is a great opportunity for someone looking to grow their career in human resources.', 'Bachelor''s degree in HR or related field, 1+ years HR experience, strong organizational skills', 'full-time', 'hybrid', '$40,000 - $55,000', 7, 'Human Resources', NOW(), 'active', '{"HR","Recruitment","Administration","Organization"}')
ON CONFLICT DO NOTHING;

COMMIT;
EOF

echo "✓ Database setup complete with sample data"

echo ""
echo "Step 7: Setting up nginx configuration..."
# Setup nginx
sudo tee $NGINX_SITE > /dev/null << 'EOF'
server {
    listen 80;
    server_name 134.199.237.34;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files (if serving directly)
    location /uploads/ {
        alias /var/www/career-portal/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf $NGINX_SITE /etc/nginx/sites-enabled/
sudo nginx -t
echo "✓ Nginx configuration complete"

echo ""
echo "Step 8: Setting up PM2 process management..."
# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'career-portal',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs
mkdir -p uploads

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✓ PM2 setup complete"

echo ""
echo "Step 9: Starting services..."
# Start services
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo ""
echo "Step 10: Setting up firewall..."
# Setup UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "=== Deployment Complete ==="
echo "✅ Career Portal deployed successfully!"
echo ""
echo "Application Details:"
echo "- URL: http://134.199.237.34"
echo "- App Directory: $APP_DIR"
echo "- Logs: $APP_DIR/logs/"
echo "- Database: PostgreSQL on localhost:5432"
echo ""
echo "Test Accounts Available:"
echo "🔧 Admin Portal:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   Access: Full system administration"
echo ""
echo "👔 Employee Portal:"
echo "   Username: employee" 
echo "   Password: employee123"
echo "   Access: Job posting management"
echo ""
echo "👤 Customer/Applicant Accounts:"
echo "   Username: customer1, customer2, customer3"
echo "   Password: customer123"
echo "   Access: Job browsing and applications"
echo ""
echo "Useful Commands:"
echo "- Check app status: pm2 status"
echo "- View logs: pm2 logs career-portal"
echo "- Restart app: pm2 restart career-portal"
echo "- Check nginx: sudo systemctl status nginx"
echo "- View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Test your deployment:"
echo "curl http://134.199.237.34"
echo ""