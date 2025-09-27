#!/bin/bash

# Start Myria node in background
echo "Starting Myria node..."
nohup myria-node > /var/log/myria/myria-node.log 2>&1 &
MYRIA_PID=$!
echo "Myria node started with PID: $MYRIA_PID"

# Wait a moment for Myria to initialize
sleep 10

# Start Riptide manager
echo "Starting Riptide manager..."
systemctl start myria-riptide-manager.service

# Keep the script running
wait
