#!/bin/bash

# Riptide Manager Wrapper Script
# This script provides a convenient way to run the Riptide manager with proper logging

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGER_SCRIPT="$SCRIPT_DIR/manager.js"
LOG_DIR="/var/log/myria"
LOG_FILE="$LOG_DIR/riptide-manager.log"
PID_FILE="/var/run/riptide-manager.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Create log directory if it doesn't exist
setup_logging() {
    if [[ ! -d "$LOG_DIR" ]]; then
        log "Creating log directory: $LOG_DIR"
        mkdir -p "$LOG_DIR"
        chmod 755 "$LOG_DIR"
    fi
    
    # Ensure log file exists and is writable
    touch "$LOG_FILE"
    chmod 644 "$LOG_FILE"
}

# Check if manager script exists
check_manager_script() {
    if [[ ! -f "$MANAGER_SCRIPT" ]]; then
        error "Manager script not found: $MANAGER_SCRIPT"
        exit 1
    fi
    
    if [[ ! -x "$MANAGER_SCRIPT" ]]; then
        log "Making manager script executable"
        chmod +x "$MANAGER_SCRIPT"
    fi
}

# Check if Node.js is available
check_nodejs() {
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    local node_version=$(node --version)
    log "Node.js version: $node_version"
}

# Check if Riptide SDK is installed
check_riptide_sdk() {
    if [[ ! -d "$SCRIPT_DIR/node_modules/@deeep-network/riptide" ]]; then
        error "Riptide SDK not found. Please run 'npm install @deeep-network/riptide'"
        exit 1
    fi
    
    log "Riptide SDK found"
}

# Check if configuration file exists
check_config() {
    local config_file="$SCRIPT_DIR/riptide.config.json"
    if [[ ! -f "$config_file" ]]; then
        error "Configuration file not found: $config_file"
        exit 1
    fi
    
    log "Configuration file found: $config_file"
}

# Check if hooks file exists
check_hooks() {
    local hooks_file="$SCRIPT_DIR/hooks.js"
    if [[ ! -f "$hooks_file" ]]; then
        error "Hooks file not found: $hooks_file"
        exit 1
    fi
    
    log "Hooks file found: $hooks_file"
}

# Start the manager
start_manager() {
    log "Starting Riptide Manager..."
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Start the manager with proper logging
    nohup node "$MANAGER_SCRIPT" >> "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Save PID
    echo $pid > "$PID_FILE"
    
    # Wait a moment to check if process started successfully
    sleep 2
    
    if kill -0 $pid 2>/dev/null; then
        success "Riptide Manager started successfully (PID: $pid)"
        log "Logs are being written to: $LOG_FILE"
        log "PID file: $PID_FILE"
    else
        error "Failed to start Riptide Manager"
        exit 1
    fi
}

# Stop the manager
stop_manager() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            log "Stopping Riptide Manager (PID: $pid)..."
            kill -TERM $pid
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 $pid 2>/dev/null && [[ $count -lt 30 ]]; do
                sleep 1
                ((count++))
            done
            
            if kill -0 $pid 2>/dev/null; then
                warning "Manager did not stop gracefully, forcing shutdown..."
                kill -KILL $pid
            fi
            
            success "Riptide Manager stopped"
        else
            warning "Manager process not running (PID: $pid)"
        fi
        
        rm -f "$PID_FILE"
    else
        warning "PID file not found: $PID_FILE"
    fi
}

# Show status
show_status() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 $pid 2>/dev/null; then
            success "Riptide Manager is running (PID: $pid)"
            log "Log file: $LOG_FILE"
            log "PID file: $PID_FILE"
        else
            warning "Riptide Manager is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        warning "Riptide Manager is not running"
    fi
}

# Show logs
show_logs() {
    local lines=${1:-50}
    log "Showing last $lines lines of log file:"
    echo "----------------------------------------"
    tail -n "$lines" "$LOG_FILE"
    echo "----------------------------------------"
}

# Main function
main() {
    case "${1:-start}" in
        start)
            check_root
            setup_logging
            check_manager_script
            check_nodejs
            check_riptide_sdk
            check_config
            check_hooks
            start_manager
            ;;
        stop)
            check_root
            stop_manager
            ;;
        restart)
            check_root
            stop_manager
            sleep 2
            setup_logging
            check_manager_script
            check_nodejs
            check_riptide_sdk
            check_config
            check_hooks
            start_manager
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "${2:-50}"
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs [lines]}"
            echo ""
            echo "Commands:"
            echo "  start   - Start the Riptide Manager (default)"
            echo "  stop    - Stop the Riptide Manager"
            echo "  restart - Restart the Riptide Manager"
            echo "  status  - Show the status of the Riptide Manager"
            echo "  logs    - Show the last N lines of logs (default: 50)"
            echo ""
            echo "Examples:"
            echo "  $0 start"
            echo "  $0 logs 100"
            echo "  $0 status"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
