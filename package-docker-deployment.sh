#!/bin/bash

# Create a complete deployment package for DigitalOcean
set -e

PACKAGE_NAME="career-portal-docker-complete"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Creating complete Docker deployment package..."

# Create package directory
mkdir -p ${PACKAGE_NAME}

# Copy all necessary files
cp Dockerfile.production ${PACKAGE_NAME}/
cp docker-compose.production.yml ${PACKAGE_NAME}/docker-compose.yml
cp init-db.sql ${PACKAGE_NAME}/
cp nginx.conf ${PACKAGE_NAME}/
cp deploy-digitalocean.sh ${PACKAGE_NAME}/
cp docker-deploy-quick.sh ${PACKAGE_NAME}/
cp test-docker-local.sh ${PACKAGE_NAME}/

# Copy application source code
cp -r server ${PACKAGE_NAME}/
cp -r shared ${PACKAGE_NAME}/
cp -r client ${PACKAGE_NAME}/
cp -r public ${PACKAGE_NAME}/
cp package*.json ${PACKAGE_NAME}/
cp tsconfig.json ${PACKAGE_NAME}/
cp tailwind.config.ts ${PACKAGE_NAME}/
cp postcss.config.js ${PACKAGE_NAME}/
cp vite.config.ts ${PACKAGE_NAME}/
cp .dockerignore ${PACKAGE_NAME}/

# Create uploads directory
mkdir -p ${PACKAGE_NAME}/uploads

# Create deployment README
cat > ${PACKAGE_NAME}/DEPLOYMENT_README.md << 'EOF'
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
EOF

# Create archive
echo "Creating deployment archive..."
tar -czf ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz ${PACKAGE_NAME}/

# Get package size
PACKAGE_SIZE=$(du -h ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz | cut -f1)

echo "✅ Deployment package created successfully!"
echo "📦 Package: ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz"
echo "📏 Size: ${PACKAGE_SIZE}"
echo ""
echo "🚀 To deploy:"
echo "1. Extract: tar -xzf ${PACKAGE_NAME}_${TIMESTAMP}.tar.gz"
echo "2. Deploy: cd ${PACKAGE_NAME} && ./docker-deploy-quick.sh"
echo ""
echo "🌐 After deployment, access at: http://64.225.6.33"

# Cleanup
rm -rf ${PACKAGE_NAME}