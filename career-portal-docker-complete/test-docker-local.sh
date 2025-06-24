#!/bin/bash

# Test Docker container locally before deployment
set -e

echo "Testing Docker container locally..."

# Build the image
echo "Building production Docker image..."
docker build -f Dockerfile.production -t career-portal-test:latest .

# Create test environment
echo "Setting up test environment..."
export POSTGRES_PASSWORD="test_password_123"
export SESSION_SECRET="test-secret-key"

# Stop any existing test containers
docker-compose -f docker-compose.production.yml -p career-portal-test down --remove-orphans 2>/dev/null || true

# Start test containers
echo "Starting test containers..."
docker-compose -f docker-compose.production.yml -p career-portal-test up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check container status
echo "Container status:"
docker-compose -f docker-compose.production.yml -p career-portal-test ps

# Test health endpoint
echo "Testing health endpoint..."
if curl -f http://localhost/api/health 2>/dev/null; then
    echo "Health check passed!"
else
    echo "Health check failed, checking logs..."
    docker-compose -f docker-compose.production.yml -p career-portal-test logs app
fi

# Test database connection
echo "Testing database connection..."
docker-compose -f docker-compose.production.yml -p career-portal-test exec -T postgres pg_isready -U career_user -d career_portal

echo "Local test completed!"
echo "Access test application at: http://localhost"
echo ""
echo "To stop test containers, run:"
echo "docker-compose -f docker-compose.production.yml -p career-portal-test down"