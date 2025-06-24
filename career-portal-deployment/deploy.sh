#!/bin/bash
set -e

echo "🚀 Deploying Career Portal..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Start the server
echo "Starting production server..."
NODE_ENV=production node production-server.js
