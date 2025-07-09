# Server Connection and Docker Deployment Guide

## Step 1: Connect to Your Server
```bash
ssh root@64.225.6.33
```
**Password:** lm48532

## Step 2: Navigate to deployment directory
```bash
cd /root
```

## Step 3: Run Docker deployment commands
```bash
# Stop any existing services
systemctl stop career-portal-production 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Build Docker containers
docker-compose -f docker-compose.replit-env.yml build --no-cache

# Start services
docker-compose -f docker-compose.replit-env.yml up -d

# Check status
docker-compose -f docker-compose.replit-env.yml ps
```

## Step 4: Test the deployment
```bash
curl http://localhost:80
```

## Expected Result:
- Career Portal accessible at: http://64.225.6.33
- All Replit functionality preserved
- Submit application button working

## Troubleshooting:
If you get connection issues, try:
```bash
ssh -o StrictHostKeyChecking=no root@64.225.6.33
```