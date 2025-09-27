#!/bin/bash

# Deployment script for Myria on VPS

set -e

echo "Deploying Myria container on VPS..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Stop existing container if running
echo "Stopping existing Myria container..."
docker-compose down 2>/dev/null || true

# Pull latest image (if using remote registry)
# echo "Pulling latest image..."
# docker pull ghcr.io/egzakutacno/deeep-myria:latest

# Build and start the container
echo "Building and starting Myria container..."
docker-compose up -d --build

# Wait for container to be ready
echo "Waiting for Myria service to start..."
sleep 10

# Check if container is running
if docker-compose ps | grep -q "myria.*Up"; then
    echo "✅ Myria container is running successfully!"
    echo ""
    echo "Container status:"
    docker-compose ps
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f myria"
    echo ""
    echo "To access the container:"
    echo "  docker exec -it myria-container bash"
    echo ""
    echo "To check Myria service status:"
    echo "  docker exec myria-container systemctl status myria.service"
else
    echo "❌ Failed to start Myria container"
    echo "Checking logs..."
    docker-compose logs myria
    exit 1
fi
