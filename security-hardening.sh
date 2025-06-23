#!/bin/bash

# Career Portal - Security Hardening Script
# Run this on your production server to improve security

echo "🔒 Starting security hardening for Career Portal..."

# 1. Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# 2. Install security tools
echo "🛡️ Installing security tools..."
apt install -y ufw fail2ban unattended-upgrades

# 3. Configure firewall
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 4. Configure fail2ban
echo "🚫 Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-dos]
enabled = true
filter = nginx-dos
logpath = /var/log/nginx/access.log
maxretry = 10
findtime = 60
bantime = 600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 5. Secure SSH
echo "🔑 Securing SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Disable root password login (keep key-based)
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

systemctl restart sshd

# 6. Configure automatic security updates
echo "🔄 Configuring automatic security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

# 7. Secure Nginx
echo "🌐 Securing Nginx..."
cat > /etc/nginx/conf.d/security.conf << 'EOF'
# Hide Nginx version
server_tokens off;

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent content type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Enable XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;
EOF

nginx -t && systemctl reload nginx

# 8. Set proper file permissions
echo "📁 Setting file permissions..."
cd /var/www/career-portal

# Set ownership
chown -R www-data:www-data .
chown -R www-data:www-data uploads/

# Set permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod +x deploy-to-new-server.sh
chmod +x security-hardening.sh

# Secure uploads directory
chmod 755 uploads/
find uploads/ -type f -exec chmod 644 {} \;

# 9. Configure log rotation
echo "📄 Configuring log rotation..."
cat > /etc/logrotate.d/career-portal << 'EOF'
/var/www/career-portal/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload career-portal
    endscript
}
EOF

# 10. Set up monitoring
echo "👁️ Setting up basic monitoring..."
cat > /usr/local/bin/career-portal-health.sh << 'EOF'
#!/bin/bash
# Basic health check script

# Check if PM2 process is running
if ! pm2 list | grep -q "career-portal.*online"; then
    echo "$(date): Career Portal process is down" >> /var/log/career-portal-health.log
    pm2 restart career-portal
fi

# Check disk space
DISK_USAGE=$(df / | grep -vE '^Filesystem' | awk '{print $5}' | sed 's/%//g')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is at ${DISK_USAGE}%" >> /var/log/career-portal-health.log
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ $MEM_USAGE -gt 85 ]; then
    echo "$(date): Memory usage is at ${MEM_USAGE}%" >> /var/log/career-portal-health.log
fi
EOF

chmod +x /usr/local/bin/career-portal-health.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/career-portal-health.sh") | crontab -

# 11. Create backup script
cat > /usr/local/bin/career-portal-backup.sh << 'EOF'
#!/bin/bash
# Backup script for Career Portal

BACKUP_DIR="/var/backups/career-portal"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /var/www career-portal --exclude=node_modules --exclude=dist

# Backup uploads
if [ -d "/var/www/career-portal/uploads" ] && [ "$(ls -A /var/www/career-portal/uploads)" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/career-portal uploads
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "$(date): Backup completed - app_$DATE.tar.gz" >> /var/log/career-portal-backup.log
EOF

chmod +x /usr/local/bin/career-portal-backup.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/career-portal-backup.sh") | crontab -

# 12. Create environment security
echo "🔐 Securing environment variables..."
if [ ! -f /var/www/career-portal/.env ]; then
    touch /var/www/career-portal/.env
fi
chmod 600 /var/www/career-portal/.env
chown www-data:www-data /var/www/career-portal/.env

echo "✅ Security hardening complete!"
echo ""
echo "📋 Security Status:"
echo "   ✅ Firewall enabled (SSH, HTTP, HTTPS only)"
echo "   ✅ Fail2ban configured for SSH and Nginx"
echo "   ✅ SSH hardened (key-based only)"
echo "   ✅ Automatic security updates enabled"
echo "   ✅ Nginx security headers configured"
echo "   ✅ File permissions secured"
echo "   ✅ Log rotation configured"
echo "   ✅ Health monitoring enabled"
echo "   ✅ Automated backups scheduled"
echo ""
echo "🔍 Next recommended steps:"
echo "   1. Set up SSL/TLS certificate (Let's Encrypt)"
echo "   2. Configure database connection limits"
echo "   3. Set up external monitoring (optional)"
echo "   4. Regular security audits"