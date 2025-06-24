# Career Portal - Production Deployment

## Quick Start

### Option 1: Direct Node.js Deployment
```bash
npm install
npm run build
NODE_ENV=production node production-server.js
```

### Option 2: Docker Deployment
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

### Option 3: Docker Compose
```bash
docker-compose up -d
```

## Features

- **Role-based Authentication**: Admin, Employee, Applicant access levels
- **Job Management**: Create, view, and manage job postings
- **Application System**: Submit and track job applications
- **File Upload**: Resume upload with validation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Session Management**: Secure session handling
- **Health Monitoring**: Built-in health check endpoints

## Default Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Employee | employee | employee123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create new job (authenticated)
- `GET /api/jobs/:id` - Get specific job

### Applications
- `GET /api/applications` - List applications (employee/admin)
- `POST /api/applications` - Submit application

### Other
- `GET /api/categories` - List job categories
- `GET /health` - Server health check

## Configuration

### Environment Variables
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (production/development)
- `SESSION_SECRET` - Session encryption key
- `HTTPS` - Enable secure cookies (true/false)

### File Structure
```
career-portal/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types/schemas
├── public/          # Static assets
├── uploads/         # File uploads
├── dist/           # Built frontend
└── production-server.js  # Production server
```

## Deployment Options

### 1. DigitalOcean/VPS
```bash
# Upload files to server
scp -r career-portal-deployment/ user@server:/var/www/

# SSH to server and deploy
ssh user@server
cd /var/www/career-portal-deployment
npm install
npm run build
NODE_ENV=production PM2_START=production-server.js pm2 start
```

### 2. Heroku
```bash
# Add Heroku remote
heroku create your-career-portal

# Deploy
git add .
git commit -m "Deploy Career Portal"
git push heroku main
```

### 3. Docker Cloud
```bash
# Build and push
docker build -t your-repo/career-portal .
docker push your-repo/career-portal

# Deploy on any Docker host
docker run -d -p 8080:8080 your-repo/career-portal
```

## Production Checklist

- [ ] Change default passwords
- [ ] Set strong SESSION_SECRET
- [ ] Configure HTTPS/SSL
- [ ] Set up database (if using PostgreSQL)
- [ ] Configure file backup
- [ ] Set up monitoring
- [ ] Configure firewall
- [ ] Set up log rotation

## Support

For issues or questions, check the health endpoint at `/health` to verify server status.

Built with React, Node.js, Express, and PostgreSQL.
