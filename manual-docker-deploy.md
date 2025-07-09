# Manual Docker Deployment for Replit Environment

## Connect to your server and run these commands:

```bash
ssh root@64.225.6.33
cd /root
```

## Step 1: Stop existing services
```bash
systemctl stop career-portal-production 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
```

## Step 2: Build Docker containers
```bash
docker-compose -f docker-compose.replit-env.yml build --no-cache
```

## Step 3: Start services
```bash
docker-compose -f docker-compose.replit-env.yml up -d
```

## Step 4: Check status
```bash
docker-compose -f docker-compose.replit-env.yml ps
```

## Step 5: View logs if needed
```bash
docker-compose -f docker-compose.replit-env.yml logs -f
```

## Expected Result:
- Career Portal accessible at: http://64.225.6.33
- PostgreSQL database running
- Exact Replit environment replicated
- Submit application button working
- All original functionality preserved

## If successful, you should see:
- Both containers running (career-portal and postgres)
- No error messages in logs
- Website accessible with all features working