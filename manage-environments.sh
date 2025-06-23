#!/bin/bash

# Career Portal - Environment Management
# Usage: ./manage-environments.sh [action] [server_ip] [environment]

ACTION=$1
SERVER_IP=$2
ENVIRONMENT=$3

show_help() {
    echo "Career Portal Environment Manager"
    echo ""
    echo "Usage: $0 [action] [server_ip] [environment]"
    echo ""
    echo "Actions:"
    echo "  setup     - Create new environment (dev, staging, prod)"
    echo "  deploy    - Deploy code to environment"
    echo "  promote   - Promote staging to production"
    echo "  rollback  - Rollback to previous version"
    echo "  status    - Show environment status"
    echo "  logs      - Show environment logs"
    echo "  cleanup   - Remove old backups"
    echo ""
    echo "Environments:"
    echo "  dev      - Development (port 81)"
    echo "  staging  - Staging (port 82)"
    echo "  prod     - Production (port 80)"
    echo ""
    echo "Examples:"
    echo "  $0 setup 64.225.6.33 staging"
    echo "  $0 deploy 64.225.6.33 dev"
    echo "  $0 promote 64.225.6.33"
    echo "  $0 status 64.225.6.33"
}

if [ -z "$ACTION" ] || [ -z "$SERVER_IP" ]; then
    show_help
    exit 1
fi

case $ACTION in
    "setup")
        if [ -z "$ENVIRONMENT" ]; then
            echo "Environment required for setup"
            exit 1
        fi
        ./setup-environments.sh $SERVER_IP $ENVIRONMENT
        ;;
        
    "deploy")
        if [ -z "$ENVIRONMENT" ]; then
            echo "Environment required for deployment"
            exit 1
        fi
        
        echo "Building locally..."
        npm run build
        
        # Create deployment package
        tar -czf update-${ENVIRONMENT}.tar.gz \
            --exclude=node_modules \
            --exclude=.git \
            --exclude=uploads \
            --exclude=.npm \
            client/ server/ shared/ \
            package.json package-lock.json \
            vite.config.ts tsconfig.json tailwind.config.ts \
            dist/
        
        # Deploy to server
        scp update-${ENVIRONMENT}.tar.gz root@$SERVER_IP:/tmp/
        
        ssh root@$SERVER_IP << ENDSSH
cd /var/www/career-portal-${ENVIRONMENT}

# Backup current version
tar -czf /var/backups/career-portal/backup-${ENVIRONMENT}-\$(date +%Y%m%d_%H%M%S).tar.gz .

# Extract updates
tar -xzf /tmp/update-${ENVIRONMENT}.tar.gz

# Install dependencies
npm install

# Rebuild
npm run build
mkdir -p dist/public
cp -r dist/dist/client/* dist/public/

# Restart
pm2 restart career-portal-${ENVIRONMENT}

rm /tmp/update-${ENVIRONMENT}.tar.gz
ENDSSH
        
        rm update-${ENVIRONMENT}.tar.gz
        echo "Deployment to $ENVIRONMENT complete"
        ;;
        
    "promote")
        echo "Promoting staging to production..."
        
        # Test staging first
        STAGING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:82)
        if [ "$STAGING_STATUS" != "200" ]; then
            echo "Staging environment not healthy. Aborting promotion."
            exit 1
        fi
        
        ssh root@$SERVER_IP << 'ENDSSH'
# Backup production
tar -czf /var/backups/career-portal/prod-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www career-portal

# Copy staging to production
rsync -av --exclude=node_modules --exclude=uploads /var/www/career-portal-staging/ /var/www/career-portal/

cd /var/www/career-portal

# Update production config
sed -i 's/PORT=5002/PORT=5000/' .env
sed -i 's/NODE_ENV=staging/NODE_ENV=production/' .env

# Restart production
pm2 restart career-portal

echo "Production promoted from staging"
ENDSSH
        ;;
        
    "rollback")
        if [ -z "$ENVIRONMENT" ]; then
            echo "Environment required for rollback"
            exit 1
        fi
        
        ssh root@$SERVER_IP << ENDSSH
cd /var/www/career-portal-${ENVIRONMENT}

# Find latest backup
LATEST_BACKUP=\$(ls -t /var/backups/career-portal/backup-${ENVIRONMENT}-*.tar.gz | head -1)

if [ -z "\$LATEST_BACKUP" ]; then
    echo "No backup found for rollback"
    exit 1
fi

echo "Rolling back to \$LATEST_BACKUP"

# Stop application
pm2 stop career-portal-${ENVIRONMENT}

# Backup current state
tar -czf /var/backups/career-portal/pre-rollback-${ENVIRONMENT}-\$(date +%Y%m%d_%H%M%S).tar.gz .

# Restore from backup
tar -xzf "\$LATEST_BACKUP"

# Restart
pm2 start career-portal-${ENVIRONMENT}

echo "Rollback complete"
ENDSSH
        ;;
        
    "status")
        echo "Environment Status for $SERVER_IP:"
        ssh root@$SERVER_IP << 'ENDSSH'
echo "PM2 Processes:"
pm2 list | grep career-portal

echo ""
echo "Environment Health:"
for env in dev staging prod; do
    case $env in
        "dev") port=81 ;;
        "staging") port=82 ;;
        "prod") port=80 ;;
    esac
    
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null || echo "DOWN")
    echo "$env (port $port): $status"
done

echo ""
echo "Disk Usage:"
df -h /var/www | grep -v Filesystem

echo ""
echo "Recent Deployments:"
tail -5 /var/log/career-portal-deployments.log 2>/dev/null || echo "No deployment log"
ENDSSH
        ;;
        
    "logs")
        if [ -z "$ENVIRONMENT" ]; then
            echo "Environment required for logs"
            exit 1
        fi
        
        ssh root@$SERVER_IP "pm2 logs career-portal-$ENVIRONMENT --lines 20"
        ;;
        
    "cleanup")
        echo "Cleaning up old backups on $SERVER_IP..."
        ssh root@$SERVER_IP << 'ENDSSH'
# Keep only last 10 backups
find /var/backups/career-portal/ -name "*.tar.gz" -type f -mtime +7 -delete

echo "Cleanup complete"
ls -la /var/backups/career-portal/ | wc -l
echo "backups remaining"
ENDSSH
        ;;
        
    *)
        show_help
        exit 1
        ;;
esac