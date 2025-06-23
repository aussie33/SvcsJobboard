#!/bin/bash

echo "Fixing build path issue..."

# Navigate to the application directory
cd /var/www/career-portal

# Stop the application
pm2 stop career-portal

# Check current build structure
echo "Current build structure:"
ls -la dist/ 2>/dev/null || echo "No dist directory found"

# Remove existing build
rm -rf dist/

# Rebuild with correct structure
echo "Rebuilding application..."
npm run build

# Check if build created the right structure
if [ -f "dist/index.html" ]; then
    echo "Build completed successfully - index.html found in dist/"
else
    echo "Build issue - creating manual structure..."
    
    # If build outputs to dist/public, move files
    if [ -d "dist/public" ]; then
        echo "Moving files from dist/public to dist/"
        mv dist/public/* dist/
        rmdir dist/public
    fi
fi

# Verify the correct files exist
echo "Checking required files:"
ls -la dist/index.html 2>/dev/null && echo "✓ index.html found" || echo "✗ index.html missing"

# Restart the application
echo "Restarting application..."
pm2 restart career-portal

# Check status
pm2 status

echo "Fix completed. Try accessing http://64.225.6.33 again"