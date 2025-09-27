#!/bin/bash

# Build script for Deep Myria Docker container
set -e

echo "Building Deep Myria Docker container..."

# Build the Docker image
docker build -t deep-myria .

echo "Build completed successfully!"
echo ""
echo "To run the container:"
echo "  docker run -d --name myria-node --privileged -v /sys/fs/cgroup:/sys/fs/cgroup:ro -p 8333:8333 -p 8334:8334 -p 8335:8335 deep-myria"
echo ""
echo "Or use docker-compose:"
echo "  docker-compose up -d"
echo ""
echo "To check if Myria is running:"
echo "  docker exec myria-node systemctl status myria"
