# Career Portal - Docker Deployment Guide for DigitalOcean

## Overview
This guide provides complete instructions for deploying the Career Portal to your DigitalOcean server using Docker containers.

## What's Included
- **Production Dockerfile**: Multi-stage build optimized for production
- **Docker Compose**: Complete stack with PostgreSQL, app, and Nginx
- **Database Initialization**: Automated schema creation and data seeding
- **Health Checks**: Built-in monitoring for all services
- **Automated Scripts**: One-command deployment solution

## Quick Deployment

### Option 1: One-Command Deployment
```bash
# Make script executable and run
chmod +x docker-deploy-quick.sh
./docker-deploy-quick.sh
```

### Option 2: Manual Step-by-Step
```bash
# 1. Build Docker image
docker build -f Dockerfile.production -t career-portal:latest .

# 2. Create deployment package
tar -czf deployment.tar.gz docker-compose.production.yml init-db.sql nginx.conf

# 3. Deploy to server
scp deployment.tar.gz root@64.225.6.33:/opt/career-portal/
ssh root@64.225.6.33 "cd /opt/career-portal && docker-compose up -d"
```

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Career Portal  │    │   PostgreSQL    │
│   Port 8080     │────│   Port 5000     │────│   Port 5432     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Access Points
- **Main Application**: http://64.225.6.33
- **Nginx Proxy**: http://64.225.6.33:8080
- **Health Check**: http://64.225.6.33/api/health

## Default Accounts
- **Admin**: admin / admin123
- **Employee**: employee / employee123
- **Applicant**: applicant / applicant123

## Production Features
- **Multi-stage Docker build** for optimized image size
- **PostgreSQL database** with persistent data
- **Nginx reverse proxy** for load balancing
- **Health checks** for all services
- **Automatic restart** policies
- **Volume persistence** for uploads and database
- **Security hardening** with non-root user

## Environment Variables
```bash
POSTGRES_PASSWORD=career_secure_password_2024
SESSION_SECRET=career-portal-super-secret-key-production-2024
NODE_ENV=production
```

## Troubleshooting

### Check Service Status
```bash
ssh root@64.225.6.33
cd /opt/career-portal
docker-compose ps
```

### View Logs
```bash
# Application logs
docker-compose logs app

# Database logs
docker-compose logs postgres

# All services
docker-compose logs
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Update Application
```bash
# Rebuild and redeploy
docker-compose down
docker-compose up -d --build
```

## Monitoring
- Health checks run every 30 seconds
- Services automatically restart on failure
- Logs are available via Docker Compose
- Database includes connection monitoring

## Security Features
- Non-root container execution
- Secure session management
- Environment variable protection
- Network isolation between containers
- Firewall-ready port configuration

## Performance Optimization
- Multi-stage Docker builds
- Production-optimized Node.js
- PostgreSQL connection pooling
- Nginx caching and compression
- Volume mounts for persistent data