#!/bin/bash
set -e

echo "🐳 Deploying Career Portal with Docker..."

# Build Docker image
docker build -t career-portal:latest .

# Stop existing container if running
docker stop career-portal 2>/dev/null || true
docker rm career-portal 2>/dev/null || true

# Run new container
docker run -d \
  --name career-portal \
  -p 8080:8080 \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  career-portal:latest

echo "✅ Career Portal deployed on http://localhost:8080"
echo "🔍 Check logs: docker logs career-portal"
echo "🛑 Stop server: docker stop career-portal"
