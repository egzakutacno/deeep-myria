#!/bin/bash

# Setup script for Myria node
# This script configures the Myria node after installation

set -e

echo "Setting up Myria node configuration..."

# Create necessary directories
mkdir -p /var/lib/myria/keystore
mkdir -p /var/lib/myria/config
mkdir -p /var/log/myria

# Generate node key (placeholder - replace with actual key generation)
if [ ! -f /var/lib/myria/node.key ]; then
    echo "Generating node key..."
    # This is a placeholder - replace with actual Myria key generation
    openssl rand -hex 32 > /var/lib/myria/node.key
    chmod 600 /var/lib/myria/node.key
    chown myria:myria /var/lib/myria/node.key
fi

# Create node configuration
cat > /var/lib/myria/config/node.conf << 'EOF'
# Myria Node Configuration
# Replace this with actual Myria configuration

# Node identity
node_name=myria-node-$(hostname)

# Network configuration
listen_address=0.0.0.0
listen_port=8080

# API configuration
api_enabled=true
api_address=0.0.0.0
api_port=9090

# Database configuration
db_path=/var/lib/myria/database

# Logging configuration
log_level=info
log_file=/var/log/myria/node.log

# RPC configuration
rpc_enabled=true
rpc_address=0.0.0.0
rpc_port=8545
EOF

# Set proper ownership
chown -R myria:myria /var/lib/myria
chown -R myria:myria /var/log/myria

# Create systemd service override (if needed)
mkdir -p /etc/systemd/system/myria.service.d
cat > /etc/systemd/system/myria.service.d/override.conf << 'EOF'
[Service]
Environment=MYRIA_CONFIG_FILE=/var/lib/myria/config/node.conf
Environment=MYRIA_DATA_DIR=/var/lib/myria
Environment=MYRIA_LOG_DIR=/var/log/myria
EOF

echo "Myria node setup completed!"
echo "Configuration files created in /var/lib/myria/config/"
echo "Data directory: /var/lib/myria"
echo "Log directory: /var/log/myria"
