#!/bin/bash

# Career Portal - DigitalOcean Docker Deployment Script
# This script deploys the Career Portal application to DigitalOcean using Docker

set -e

echo "🚀 Starting Career Portal deployment to DigitalOcean..."

# Configuration
SERVER_IP="${SERVER_IP:-64.225.6.33}"
SERVER_USER="${SERVER_USER:-root}"
APP_NAME="career-portal"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-career_secure_password_2024}"
SESSION_SECRET="${SESSION_SECRET:-career-portal-super-secret-key-production-2024}"

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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH is not available. Please install SSH client."
        exit 1
    fi
    
    print_status "Dependencies check passed ✓"
}

# Build Docker image
build_image() {
    print_status "Building Docker image..."
    
    # Build the production image
    docker build -f Dockerfile.production -t ${APP_NAME}:latest .
    
    # Tag for deployment
    docker tag ${APP_NAME}:latest ${APP_NAME}:production
    
    print_status "Docker image built successfully ✓"
}

# Save image to tar file
save_image() {
    print_status "Saving Docker image..."
    
    docker save ${APP_NAME}:production > ${APP_NAME}-docker-image.tar
    
    print_status "Docker image saved ✓"
}

# Deploy to DigitalOcean server
deploy_to_server() {
    print_status "Deploying to DigitalOcean server ($SERVER_IP)..."
    
    # Create deployment directory on server
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p /opt/${APP_NAME}"
    
    # Copy files to server
    print_status "Copying files to server..."
    scp ${APP_NAME}-docker-image.tar ${SERVER_USER}@${SERVER_IP}:/opt/${APP_NAME}/
    scp docker-compose.production.yml ${SERVER_USER}@${SERVER_IP}:/opt/${APP_NAME}/docker-compose.yml
    scp init-db.sql ${SERVER_USER}@${SERVER_IP}:/opt/${APP_NAME}/
    scp nginx.conf ${SERVER_USER}@${SERVER_IP}:/opt/${APP_NAME}/
    
    # Deploy on server
    ssh ${SERVER_USER}@${SERVER_IP} << EOF
        set -e
        cd /opt/${APP_NAME}
        
        echo "🔧 Setting up Docker environment..."
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo "Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl start docker
            systemctl enable docker
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            echo "Installing Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Load Docker image
        echo "📦 Loading Docker image..."
        docker load < ${APP_NAME}-docker-image.tar
        
        # Stop existing containers
        echo "🛑 Stopping existing containers..."
        docker-compose down --remove-orphans || true
        
        # Set environment variables
        export POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
        export SESSION_SECRET=${SESSION_SECRET}
        
        # Start services
        echo "🚀 Starting services..."
        docker-compose up -d
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be ready..."
        sleep 30
        
        # Check service health
        echo "🔍 Checking service health..."
        docker-compose ps
        
        # Show logs
        echo "📋 Recent logs:"
        docker-compose logs --tail=20
        
        # Cleanup
        rm -f ${APP_NAME}-docker-image.tar
        
        echo "✅ Deployment completed!"
        echo "🌐 Application should be available at:"
        echo "   - http://${SERVER_IP} (Direct access)"
        echo "   - http://${SERVER_IP}:8080 (Nginx proxy)"
EOF
    
    print_status "Deployment completed successfully ✓"
}

# Cleanup local files
cleanup() {
    print_status "Cleaning up local files..."
    rm -f ${APP_NAME}-docker-image.tar
    print_status "Cleanup completed ✓"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    sleep 10
    
    if curl -f -s http://${SERVER_IP}/api/health > /dev/null; then
        print_status "Health check passed ✓"
        print_status "🎉 Career Portal is running successfully!"
        echo ""
        echo "🌐 Access your Career Portal at:"
        echo "   → http://${SERVER_IP}"
        echo ""
        echo "📊 Admin credentials:"
        echo "   → Username: admin"
        echo "   → Password: admin123"
        echo ""
        echo "👥 Test accounts:"
        echo "   → Employee: employee / employee123"
        echo "   → Applicant: applicant / applicant123"
    else
        print_warning "Health check failed. The application might still be starting up."
        print_status "Check logs with: ssh ${SERVER_USER}@${SERVER_IP} 'cd /opt/${APP_NAME} && docker-compose logs'"
    fi
}

# Main deployment process
main() {
    echo "🏗️  Career Portal - DigitalOcean Docker Deployment"
    echo "=================================================="
    echo ""
    
    check_dependencies
    build_image
    save_image
    deploy_to_server
    cleanup
    health_check
    
    echo ""
    print_status "🎯 Deployment completed successfully!"
    echo ""
}

# Run main function
main "$@"