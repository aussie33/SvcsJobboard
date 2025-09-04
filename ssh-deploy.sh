#!/bin/bash

# SSH deployment script - connects to server and runs deployment
# This allows automated deployment from Replit to your Ubuntu server

set -e

echo "=== SSH Automated Deployment ==="
echo "Target: 64.225.6.33"
echo "Date: $(date)"
echo ""

# Configuration - UPDATE THESE VALUES
SERVER="64.225.6.33"
SERVER_USER="root"  # Change to your actual username
SSH_KEY_PATH="~/.ssh/id_rsa"  # Path to your SSH private key
TEMP_DIR="/tmp/career-portal"

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    echo "Please set up SSH key authentication first:"
    echo "1. Generate key: ssh-keygen -t rsa -b 4096"
    echo "2. Copy to server: ssh-copy-id $SERVER_USER@$SERVER"
    exit 1
fi

# Function to run commands on remote server
run_remote() {
    echo "🔗 Running on server: $1"
    ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER" "$1"
}

# Function to upload files to server
upload_files() {
    echo "📤 Uploading files to server..."
    
    # Create package directory
    mkdir -p deploy-package
    rm -rf deploy-package/*
    
    # Copy built application
    if [ -d "dist" ]; then
        cp -r dist/* deploy-package/
    else
        echo "❌ No dist directory found. Running build..."
        npm run build
        cp -r dist/* deploy-package/
    fi
    
    # Copy deployment scripts
    cp backup-server.sh deploy-package/
    cp deploy-to-ubuntu.sh deploy-package/
    cp package.json deploy-package/
    
    # Upload using rsync
    rsync -avz -e "ssh -i $SSH_KEY_PATH -o StrictHostKeyChecking=no" \
        deploy-package/ "$SERVER_USER@$SERVER:$TEMP_DIR/"
    
    # Clean up
    rm -rf deploy-package
    
    echo "✅ Files uploaded successfully"
}

# Function to backup current installation
backup_current() {
    echo "💾 Creating backup of current installation..."
    run_remote "cd $TEMP_DIR && chmod +x backup-server.sh && ./backup-server.sh"
    echo "✅ Backup completed"
}

# Function to deploy new version
deploy_new() {
    echo "🚀 Deploying new version..."
    run_remote "cd $TEMP_DIR && chmod +x deploy-to-ubuntu.sh && ./deploy-to-ubuntu.sh"
    echo "✅ Deployment completed"
}

# Function to verify deployment
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Check if application is responding
    if run_remote "curl -f -s http://localhost:5000 > /dev/null"; then
        echo "✅ Application is responding on localhost:5000"
    else
        echo "❌ Application not responding on localhost:5000"
        return 1
    fi
    
    # Check nginx status
    if run_remote "systemctl is-active --quiet nginx"; then
        echo "✅ Nginx is running"
    else
        echo "❌ Nginx is not running"
        return 1
    fi
    
    # Check PM2 status
    if run_remote "pm2 list | grep -q career-portal"; then
        echo "✅ PM2 process is running"
    else
        echo "❌ PM2 process not found"
        return 1
    fi
    
    echo "✅ Deployment verification successful"
}

# Main deployment flow
main() {
    echo "Starting automated deployment..."
    
    # Test SSH connection
    echo "🔗 Testing SSH connection..."
    if ! run_remote "echo 'SSH connection successful'"; then
        echo "❌ Cannot connect to server via SSH"
        exit 1
    fi
    
    # Upload files
    upload_files
    
    # Create backup
    backup_current
    
    # Deploy new version
    deploy_new
    
    # Verify deployment
    if verify_deployment; then
        echo ""
        echo "🎉 Deployment Successful!"
        echo "Your career portal is now live at: http://$SERVER"
    else
        echo ""
        echo "⚠️  Deployment completed but verification failed"
        echo "Please check the application manually"
    fi
    
    echo ""
    echo "Useful commands:"
    echo "- Check logs: ssh $SERVER_USER@$SERVER 'pm2 logs career-portal'"
    echo "- Restart app: ssh $SERVER_USER@$SERVER 'pm2 restart career-portal'"
    echo "- Check status: ssh $SERVER_USER@$SERVER 'pm2 status'"
}

# Run main function
main "$@"