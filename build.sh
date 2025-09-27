#!/bin/bash

# Build script for Myria Docker container with systemd

set -e

echo "Building Myria Docker container with systemd support..."

# Build the Docker image
docker build -t myria-systemd:latest .

echo "Docker image built successfully!"
echo "Image name: myria-systemd:latest"

# Optional: Tag for GitHub Container Registry
echo "Tagging image for GitHub Container Registry..."
docker tag myria-systemd:latest ghcr.io/egzakutacno/deeep-myria:latest

echo "Build completed!"
echo ""
echo "To run the container:"
echo "  docker run --privileged -d --name myria-container -v /sys/fs/cgroup:/sys/fs/cgroup:ro myria-systemd:latest"
echo ""
echo "To run with docker-compose:"
echo "  docker-compose up -d"
echo ""
echo "To push to GitHub Container Registry:"
echo "  docker push ghcr.io/egzakutacno/deeep-myria:latest"
