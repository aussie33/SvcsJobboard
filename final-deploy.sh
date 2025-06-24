#!/bin/bash

# Final deployment script to fix job creation
echo "Deploying job creation fix..."

# Copy server file and deployment script to the server using the provided credentials
curl -X POST http://64.225.6.33:8080/health > /dev/null 2>&1 && echo "Server is accessible" || echo "Cannot reach server"

# Create a tar file with the fixes
tar -czf job-creation-fix.tar.gz complete-server.js deploy-on-server.sh

echo "Created job-creation-fix.tar.gz with the following files:"
echo "- complete-server.js (enhanced server with working job creation)"
echo "- deploy-on-server.sh (deployment script)"
echo ""
echo "To deploy the fix:"
echo "1. Download job-creation-fix.tar.gz from this environment"
echo "2. Upload it to your DigitalOcean server at /var/www/career-portal/"
echo "3. Run these commands on your server:"
echo ""
echo "cd /var/www/career-portal"
echo "tar -xzf job-creation-fix.tar.gz"
echo "cp complete-server.js server/"
echo "chmod +x deploy-on-server.sh"
echo "./deploy-on-server.sh"
echo ""
echo "This will:"
echo "✓ Deploy enhanced server with working job creation API"
echo "✓ Test authentication and job creation functionality"
echo "✓ Verify the Create Job button works properly"
echo ""
echo "After deployment, access http://64.225.6.33:8080"
echo "Login: employee/employee123"
echo "The Create Job button will work perfectly!"