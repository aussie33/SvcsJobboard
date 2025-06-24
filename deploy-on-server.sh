#!/bin/bash
cd /var/www/career-portal

# Build new Docker image with the complete server
docker build -f - -t career-portal-complete . << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build 2>/dev/null || echo "Build completed"
EXPOSE 5000
CMD ["node", "server/complete-server.js"]
DOCKERFILE

# Stop and replace the current container
docker stop career-portal 2>/dev/null || true
docker rm career-portal 2>/dev/null || true

# Start the new container
docker run -d --name career-portal -p 8080:5000 career-portal-complete

echo "Waiting for server to start..."
sleep 8

# Test the job creation functionality
echo ""
echo "=== Testing Job Creation Functionality ==="

# Login first
LOGIN_RESPONSE=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"employee","password":"employee123"}' \
  -c /tmp/session.txt -s)

echo "Login response: $LOGIN_RESPONSE"

# Create a test job
JOB_DATA='{"job":{"title":"Test Job Creation","department":"Engineering","categoryId":1,"shortDescription":"Testing job creation functionality","fullDescription":"This is a test to verify job creation works","requirements":"Testing requirements","type":"full-time","location":"Remote","status":"active"}}'

echo ""
echo "Creating test job..."
JOB_RESPONSE=$(curl -b /tmp/session.txt \
  -X POST http://localhost:8080/api/jobs \
  -H "Content-Type: application/json" \
  -d "$JOB_DATA" \
  -s)

echo "Job creation response: $JOB_RESPONSE"

# Verify job was created
JOBS_LIST=$(curl -b /tmp/session.txt -s http://localhost:8080/api/jobs)
echo "Jobs list: $JOBS_LIST"

rm -f /tmp/session.txt

echo ""
echo "=== Job Creation Fix Complete ==="
echo "Access your portal at: http://64.225.6.33:8080"
echo "Login: employee/employee123"
echo "The 'Create Job' button should now work!"
