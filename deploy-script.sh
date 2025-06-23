#!/bin/bash
set -e

echo "========================================"
echo "Career Portal Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   print_status "Please run as a regular user with sudo privileges"
   exit 1
fi

print_status "Starting Career Portal deployment..."

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 if not present
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    print_status "Installing PostgreSQL..."
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    print_status "PostgreSQL already installed"
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    print_status "Nginx already installed"
fi

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'career_portal';" | grep -q 1 || sudo -u postgres createdb career_portal
sudo -u postgres psql -c "DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'jobadmin') THEN
      CREATE USER jobadmin WITH ENCRYPTED PASSWORD 'securepassword';
   END IF;
END
\$\$;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE career_portal TO jobadmin;"
sudo -u postgres psql -c "ALTER DATABASE career_portal OWNER TO jobadmin;"

print_status "Database setup completed"

# Create web directory and set permissions
print_status "Setting up application directory..."
sudo mkdir -p /var/www
cd /var/www

# Remove existing directory if it exists
if [ -d "career-portal" ]; then
    print_warning "Removing existing career-portal directory..."
    sudo rm -rf career-portal
fi

# Clone repository
print_status "Cloning repository from GitHub..."
sudo git clone https://github.com/aussie33/SvcsJobboard.git career-portal
cd career-portal

# Set proper ownership
sudo chown -R $USER:$USER /var/www/career-portal

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://jobadmin:securepassword@localhost:5432/career_portal
SESSION_SECRET=a7c93f3d9f927a6a5c9b3d1d93fdd0fc4a3c1f276bc8e3ea4b6a7a5b7c93e3ad
EOF

print_status "Environment file created"

# Run database migration
print_status "Running database migration..."
node migrate.js

print_status "Database migration completed - Test accounts created:"
print_status "  Admin: admin/admin123"
print_status "  Employee: employee/employee123"
print_status "  Applicant: applicant/applicant123"

# Build application
print_status "Building application..."
npm run build

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Stop existing PM2 process if running
pm2 delete career-portal 2>/dev/null || true

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start npm --name "career-portal" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
print_status "Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin $(which pm2) startup systemd -u $USER --hp $HOME

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/career-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

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
    }

    # Handle file uploads
    client_max_body_size 10M;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/career-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Setup UFW firewall (basic configuration)
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

print_status "========================================"
print_status "DEPLOYMENT COMPLETED SUCCESSFULLY!"
print_status "========================================"
print_status ""
print_status "Your Career Portal is now running at:"
print_status "  HTTP: http://$(curl -s ifconfig.me)"
print_status ""
print_status "Test Accounts:"
print_status "  👤 Admin Portal: admin / admin123"
print_status "  💼 Employee Portal: employee / employee123"  
print_status "  📝 Applicant Portal: applicant / applicant123"
print_status ""
print_status "Application Status:"
pm2 status
print_status ""
print_status "To view logs: pm2 logs career-portal"
print_status "To restart: pm2 restart career-portal"
print_status "To stop: pm2 stop career-portal"
print_status ""
print_status "Next Steps:"
print_status "1. Point your domain to this server's IP"
print_status "2. Update server_name in /etc/nginx/sites-available/career-portal"
print_status "3. Install SSL certificate with: sudo certbot --nginx"
print_status ""
print_warning "Important: Change default passwords after testing!"