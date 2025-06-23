# Career Portal - Complete Deployment Guide

## Step-by-Step Deployment to DigitalOcean

### Prerequisites
- DigitalOcean VPS with Ubuntu 20.04+
- Domain name pointed to your server IP
- PostgreSQL installed and running
- Node.js 18+ installed
- Nginx installed

---

## 1. Server Setup (One-time setup)

### Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2
```

### Setup PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE career_portal;
CREATE USER jobadmin WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE career_portal TO jobadmin;
\q
```

---

## 2. Deploy Application Code

### Clone from GitHub
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/aussie33/SvcsJobboard.git career-portal
cd career-portal

# Set ownership
sudo chown -R $USER:$USER /var/www/career-portal
```

### Install Dependencies
```bash
npm install
```

### Setup Environment Variables
```bash
nano .env
```

Add the following content:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://jobadmin:securepassword@localhost:5432/career_portal
SESSION_SECRET=a7c93f3d9f927a6a5c9b3d1d93fdd0fc4a3c1f276bc8e3ea4b6a7a5b7c93e3ad
```

---

## 3. Database Migration

### Run Migration Script
```bash
node migrate.js
```

This creates all tables and inserts test data:
- **Admin Account**: username: `admin`, password: `admin123`
- **Employee Account**: username: `employee`, password: `employee123`  
- **Applicant Account**: username: `applicant`, password: `applicant123`

---

## 4. Build and Start Application

### Build the Application
```bash
npm run build
```

### Start with PM2
```bash
# Start the application
pm2 start npm --name "career-portal" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

---

## 5. Configure Nginx

### Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/career-portal
```

Add this configuration (replace `your-domain.com` with your actual domain):
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
```

### Enable the Site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/career-portal /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 6. Setup SSL Certificate (Optional but Recommended)

### Install Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 7. Test Your Deployment

### Check Application Status
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs career-portal

# Check Nginx status
sudo systemctl status nginx
```

### Test in Browser
1. Visit your domain: `https://your-domain.com`
2. Try logging in with test accounts:
   - **Admin**: admin/admin123
   - **Employee**: employee/employee123
   - **Applicant**: applicant/applicant123

---

## 8. Future Updates

### To Deploy Updates from GitHub:
```bash
cd /var/www/career-portal
git pull origin main
npm install
npm run build
pm2 restart career-portal
```

---

## Test Accounts Available After Deployment

Once deployed, you can immediately test with these accounts:

### 🔧 Admin Portal
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system administration, user management, all job postings

### 👔 Employee Portal  
- **Username**: `employee`
- **Password**: `employee123`
- **Access**: Create/manage job postings, view applications

### 👤 Public/Applicant Portal
- **Username**: `applicant` 
- **Password**: `applicant123`
- **Access**: Browse jobs, submit applications

---

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check database exists
   sudo -u postgres psql -l | grep career_portal
   ```

2. **Application Won't Start**
   ```bash
   # Check logs
   pm2 logs career-portal
   
   # Check environment variables
   cat .env
   ```

3. **Nginx 502 Error**
   ```bash
   # Check if app is running on port 5000
   netstat -tlnp | grep :5000
   
   # Check Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

4. **File Upload Issues**
   ```bash
   # Create uploads directory if it doesn't exist
   mkdir -p /var/www/career-portal/uploads
   chmod 755 /var/www/career-portal/uploads
   ```

---

## Security Notes

- Change default passwords immediately after testing
- Keep your system updated: `sudo apt update && sudo apt upgrade`
- Monitor logs regularly: `pm2 logs career-portal`
- Consider setting up fail2ban for additional security
- Backup your database regularly

Your Career Portal is now live and ready for use!