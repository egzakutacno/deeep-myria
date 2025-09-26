#!/bin/bash

# Test script for Myria Node Riptide SDK hooks
# This script tests the lifecycle hooks and secret management

set -e

echo "🧪 Testing Myria Node Riptide SDK Hooks"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Configuration
BASE_URL="http://localhost:3000"
API_KEY="test-api-key-123"

# Test functions
test_health() {
    print_info "Testing health endpoint..."
    response=$(curl -s "$BASE_URL/health")
    if echo "$response" | grep -q "myria-node"; then
        print_status "Health endpoint working"
    else
        print_error "Health endpoint failed"
        echo "$response"
    fi
}

test_install_secrets() {
    print_info "Testing install secrets..."
    response=$(curl -s -X POST "$BASE_URL/myria/secrets" \
        -H "Content-Type: application/json" \
        -d "{\"secrets\": {\"MYRIA_API_KEY\": \"$API_KEY\", \"MYRIA_NETWORK_KEY\": \"test-network-key\"}}")
    
    if echo "$response" | grep -q "success.*true"; then
        print_status "Secrets installed successfully"
    else
        print_error "Failed to install secrets"
        echo "$response"
    fi
}

test_start() {
    print_info "Testing start hook..."
    response=$(curl -s -X POST "$BASE_URL/myria/start")
    
    if echo "$response" | grep -q "success.*true"; then
        print_status "Start hook executed successfully"
    else
        print_warning "Start hook failed (expected if myria-node command not found)"
        echo "$response"
    fi
}

test_status() {
    print_info "Testing status hook..."
    response=$(curl -s "$BASE_URL/myria/status")
    
    if echo "$response" | grep -q "myria-node"; then
        print_status "Status hook working"
    else
        print_error "Status hook failed"
        echo "$response"
    fi
}

test_stop() {
    print_info "Testing stop hook..."
    response=$(curl -s -X POST "$BASE_URL/myria/stop")
    
    if echo "$response" | grep -q "success.*true"; then
        print_status "Stop hook executed successfully"
    else
        print_warning "Stop hook failed (expected if myria-node command not found)"
        echo "$response"
    fi
}

test_metrics() {
    print_info "Testing metrics endpoint..."
    response=$(curl -s "$BASE_URL/myria/metrics")
    
    if echo "$response" | grep -q "timestamp"; then
        print_status "Metrics endpoint working"
    else
        print_error "Metrics endpoint failed"
        echo "$response"
    fi
}

# Main test execution
echo ""
print_info "Starting hook tests..."
echo ""

# Wait for service to be ready
print_info "Waiting for service to be ready..."
sleep 5

# Run tests
test_health
echo ""
test_install_secrets
echo ""
test_start
echo ""
test_status
echo ""
test_metrics
echo ""
test_stop
echo ""

print_status "Hook testing completed!"
echo ""
print_info "Available endpoints:"
echo "  • Health: $BASE_URL/health"
echo "  • Status: $BASE_URL/myria/status"
echo "  • Metrics: $BASE_URL/myria/metrics"
echo "  • Start: POST $BASE_URL/myria/start"
echo "  • Stop: POST $BASE_URL/myria/stop"
echo "  • Secrets: POST $BASE_URL/myria/secrets"
echo ""
print_info "To test manually:"
echo "  curl -X POST $BASE_URL/myria/secrets -H 'Content-Type: application/json' -d '{\"secrets\": {\"MYRIA_API_KEY\": \"your-key\"}}'"
echo "  curl -X POST $BASE_URL/myria/start"
echo "  curl $BASE_URL/myria/status"
echo "  curl -X POST $BASE_URL/myria/stop"
