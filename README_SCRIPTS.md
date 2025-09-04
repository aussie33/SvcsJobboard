# Replit to Ubuntu Server Deployment Scripts

## 🚀 Quick Deployment

### Automated Deployment (Recommended)
```bash
./ssh-deploy.sh
```

### Manual Deployment
```bash
./upload-to-server.sh    # Upload files
ssh root@64.225.6.33     # Connect to server
cd /tmp/career-portal    # Navigate to uploaded files
./backup-server.sh       # Backup current site
./deploy-to-ubuntu.sh    # Deploy new version
```

## 📁 Scripts Overview

| Script | Purpose |
|--------|---------|
| `ssh-deploy.sh` | **Fully automated deployment** - Uploads, backs up, deploys, and verifies |
| `upload-to-server.sh` | **Upload files** to server /tmp/career-portal directory |
| `backup-server.sh` | **Create timestamped backup** of current installation |
| `deploy-to-ubuntu.sh` | **Deploy application** with full Ubuntu server setup |

## ⚙️ Configuration

Edit these variables in the scripts:
- **SERVER**: `64.225.6.33`
- **SERVER_USER**: `root` (change to your username)
- **SSH_KEY_PATH**: `~/.ssh/id_rsa` (your SSH key location)

## 🎯 What Gets Deployed

✅ **Production-built** React + Node.js application  
✅ **PostgreSQL database** with schema and sample data  
✅ **Nginx reverse proxy** configuration  
✅ **PM2 process management** for auto-restart  
✅ **SSL-ready** configuration  
✅ **Firewall setup** (ports 22, 80, 443)  

## 🔐 Access After Deployment

- **URL**: http://64.225.6.33
- **Admin**: admin / admin123
- **Employee**: employee / employee123  
- **Applicant**: applicant / applicant123

## 📊 Application Features

✅ **Role-based navigation** - Shows appropriate menus based on user type  
✅ **Purple branding** with "The Resource Consultants" logo  
✅ **Job listings** with categories and search  
✅ **User management** (Admin portal)  
✅ **Application tracking** with resume uploads  
✅ **Responsive design** for all devices  

## 🛠️ Server Management

```bash
# Check application status
pm2 status

# View logs
pm2 logs career-portal

# Restart application  
pm2 restart career-portal

# Check nginx
sudo systemctl status nginx
```