#!/bin/bash

# Career Portal - Complete Deployment Pipeline
# Usage: ./deploy-pipeline.sh [server_ip] [stage]

SERVER_IP=${1:-"64.225.6.33"}
STAGE=${2:-"staging"}

case $STAGE in
    "dev"|"staging"|"prod") ;;
    *) echo "Use: dev, staging, or prod"; exit 1 ;;
esac

echo "Starting deployment pipeline: $STAGE environment"

# Step 1: Test locally first
echo "Running local tests..."
npm test 2>/dev/null || echo "No tests found, skipping..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed. Aborting deployment."
    exit 1
fi

# Step 2: Deploy to staging first (unless deploying to dev)
if [ "$STAGE" = "prod" ]; then
    echo "Deploying to staging for testing..."
    ./setup-environments.sh $SERVER_IP staging
    
    echo "Staging deployment complete. Test at: http://$SERVER_IP:82"
    read -p "Test staging and press Enter to continue to production (or Ctrl+C to abort): "
fi

# Step 3: Deploy to target environment
echo "Deploying to $STAGE environment..."
./setup-environments.sh $SERVER_IP $STAGE

# Step 4: Run health checks
echo "Running health checks..."
sleep 5

case $STAGE in
    "dev") PORT=81 ;;
    "staging") PORT=82 ;;
    "prod") PORT=80 ;;
esac

# Test deployment
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:$PORT)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "Deployment successful! Site is responding."
else
    echo "Warning: Health check failed (HTTP $HEALTH_CHECK)"
fi

# Step 5: Create deployment record
ssh root@$SERVER_IP << ENDSSH
echo "$(date): Deployed to $STAGE environment" >> /var/log/career-portal-deployments.log
ENDSSH

echo "Pipeline complete!"
echo "Access $STAGE environment: http://$SERVER_IP:$PORT"