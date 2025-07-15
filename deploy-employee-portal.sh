#!/bin/bash

# Deploy Employee Portal to Ubuntu Server
echo "Deploying Employee Portal to Ubuntu Server..."

# Copy the updated server file
sshpass -p 'lm48532' scp -o StrictHostKeyChecking=no complete-career-portal.cjs root@64.225.6.33:/root/

# Stop existing server and restart with employee portal
sshpass -p 'lm48532' ssh -o StrictHostKeyChecking=no root@64.225.6.33 << 'EOF'
pkill -f "node complete-career-portal.cjs" || true
cd /root
nohup node complete-career-portal.cjs > career-portal.log 2>&1 &
echo "Server restarted with Employee Portal"
EOF

echo "Employee Portal deployment complete!"
echo "Access the portals at:"
echo "Main Portal: http://64.225.6.33/"
echo "Employee Portal: http://64.225.6.33/employee"
echo "Admin Portal: http://64.225.6.33/admin"