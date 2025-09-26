#!/bin/bash

# Myria Node with Riptide SDK Deployment Script
# This script helps you build and deploy the integrated system

set -e

echo "🚀 Myria Node with Riptide SDK Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Check if required files exist
required_files=("Dockerfile-riptide" "package-riptide.json" "riptide.config.json" "index.js" "hooks.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file $file not found"
        exit 1
    fi
done

print_status "All required files found"

# Stop and remove existing container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q "myria-riptide"; then
    print_warning "Stopping existing myria-riptide container..."
    docker stop myria-riptide || true
    docker rm myria-riptide || true
fi

# Build the Docker image
print_status "Building Docker image..."
docker build -f Dockerfile-riptide -t myria-riptide-node .

if [ $? -eq 0 ]; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Run the container
print_status "Starting container..."
docker run --privileged --cgroupns=host \
  --name myria-riptide \
  --restart=always \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -d myria-riptide-node \
  /lib/systemd/systemd

if [ $? -eq 0 ]; then
    print_status "Container started successfully"
else
    print_error "Failed to start container"
    exit 1
fi

# Wait for services to start
print_status "Waiting for services to start..."
sleep 30

# Check container status
if docker ps --format 'table {{.Names}}' | grep -q "myria-riptide"; then
    print_status "Container is running"
else
    print_error "Container failed to start"
    docker logs myria-riptide
    exit 1
fi

# Test endpoints
print_status "Testing endpoints..."

# Wait a bit more for the API to be ready
sleep 10

# Test health endpoint
if curl -s http://localhost:3000/health > /dev/null; then
    print_status "Health endpoint is responding"
else
    print_warning "Health endpoint not responding yet"
fi

# Test Myria health endpoint
if curl -s http://localhost:3000/myria/health > /dev/null; then
    print_status "Myria health endpoint is responding"
else
    print_warning "Myria health endpoint not responding yet"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Available endpoints:"
echo "  • Health: http://localhost:3000/health"
echo "  • Status: http://localhost:3000/status"
echo "  • Metrics: http://localhost:3000/metrics"
echo "  • Myria Health: http://localhost:3000/myria/health"
echo "  • Myria Status: http://localhost:3000/myria/status"
echo "  • Myria Metrics: http://localhost:3000/myria/metrics"
echo "  • Myria Start: POST http://localhost:3000/myria/start"
echo "  • Myria Stop: POST http://localhost:3000/myria/stop"
echo "  • Myria Secrets: POST http://localhost:3000/myria/secrets"
echo ""
echo "🔧 Management commands:"
echo "  • View logs: docker logs -f myria-riptide"
echo "  • Enter container: docker exec -it myria-riptide bash"
echo "  • Stop container: docker stop myria-riptide"
echo "  • Remove container: docker rm myria-riptide"
echo ""
echo "🧪 Test the hooks:"
echo "  • Run test script: chmod +x test-hooks.sh && ./test-hooks.sh"
echo ""
echo "📚 For more information, see README-Riptide.md"
