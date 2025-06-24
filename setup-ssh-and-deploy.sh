#!/bin/bash

# Complete setup: SSH key generation and deployment
set -e

SERVER_IP="64.225.6.33"
SERVER_USER="root"

echo "Setting up SSH key authentication and deploying..."

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "replit-deploy@$(date +%s)"
    chmod 600 ~/.ssh/id_rsa
    chmod 644 ~/.ssh/id_rsa.pub
fi

echo "SSH key ready. Setting up passwordless authentication..."

# Create expect script for SSH key copying
cat > /tmp/copy_key.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 30
set server [lindex $argv 0]
set password [lindex $argv 1]

spawn ssh-copy-id -o StrictHostKeyChecking=no root@$server
expect {
    "password:" {
        send "$password\r"
        expect {
            "Number of key(s) added:" {
                puts "SSH key added successfully"
                exit 0
            }
            timeout {
                puts "Timeout waiting for confirmation"
                exit 1
            }
        }
    }
    "All keys were skipped" {
        puts "SSH key already exists"
        exit 0
    }
    timeout {
        puts "Timeout waiting for password prompt"
        exit 1
    }
}
EOF

chmod +x /tmp/copy_key.exp

echo ""
echo "To complete setup, I need your DigitalOcean server password"
echo "This is only needed once to set up passwordless authentication"
echo ""
read -s -p "Enter password for root@64.225.6.33: " SERVER_PASSWORD
echo ""

# Install expect if not available
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    apt-get update && apt-get install -y expect || {
        echo "Please install expect manually: apt-get install expect"
        exit 1
    }
fi

# Copy SSH key to server
echo "Copying SSH key to server..."
/tmp/copy_key.exp $SERVER_IP "$SERVER_PASSWORD"

# Clean up expect script
rm -f /tmp/copy_key.exp

echo "SSH key setup complete. Now deploying..."

# Now run the deployment with SSH key authentication
./deploy-with-key.sh