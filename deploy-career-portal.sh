#!/bin/bash

echo "🚀 Deploying Career Portal..."

# Stop existing processes
pkill -f "node.*server" 2>/dev/null || true
pkill -f "simple-http-server" 2>/dev/null || true

# Start the server
echo "Starting server on port 80..."
node simple-http-server.js &

# Wait for server to start
sleep 5

# Check if server is running
if ps aux | grep -v grep | grep "simple-http-server" > /dev/null; then
    echo "✅ Server is running!"
    echo "🌐 Career Portal accessible at: http://64.225.6.33"
    
    # Test the server
    if curl -f -s http://localhost:80 > /dev/null; then
        echo "✅ Server is responding"
    else
        echo "⚠️  Server may still be starting..."
    fi
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "🎉 Deployment completed!"