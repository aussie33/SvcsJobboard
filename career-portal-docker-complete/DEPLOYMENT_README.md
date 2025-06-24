# Career Portal - Docker Deployment Package

This package contains everything needed to deploy the Career Portal to DigitalOcean using Docker.

## Quick Deployment

1. **Extract the package** on your local machine
2. **Run the quick deployment script**:
   ```bash
   chmod +x docker-deploy-quick.sh
   ./docker-deploy-quick.sh
   ```

## Manual Deployment Steps

1. **Build the Docker image**:
   ```bash
   docker build -f Dockerfile.production -t career-portal:latest .
   ```

2. **Deploy using Docker Compose**:
   ```bash
   # Copy files to server
   scp -r . root@64.225.6.33:/opt/career-portal/
   
   # SSH to server and deploy
   ssh root@64.225.6.33
   cd /opt/career-portal
   docker-compose up -d
   ```

## Testing Locally

Test the Docker container locally before deployment:
```bash
chmod +x test-docker-local.sh
./test-docker-local.sh
```

## Access Information

- **Application URL**: http://64.225.6.33
- **Admin Login**: admin / admin123
- **Employee Login**: employee / employee123
- **Applicant Login**: applicant / applicant123

## Architecture

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Proxy**: Nginx (optional)

## Environment Variables

- `POSTGRES_PASSWORD`: Database password
- `SESSION_SECRET`: Session encryption key
- `NODE_ENV`: Set to 'production'

## Troubleshooting

1. **Check container status**:
   ```bash
   docker-compose ps
   ```

2. **View logs**:
   ```bash
   docker-compose logs app
   docker-compose logs postgres
   ```

3. **Restart services**:
   ```bash
   docker-compose restart
   ```

## Support

For technical support, check the logs and ensure all containers are running properly.
