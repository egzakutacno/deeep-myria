/**
 * Riptide SDK Hooks Implementation for Myria Node
 * 
 * This file contains hooks specifically designed for Myria node integration
 * with the Riptide SDK.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * MINIMAL REQUIRED HOOKS
 * These are the core hooks that Myria node projects will need
 */

/**
 * Heartbeat Hook - Periodic health updates
 * Called every heartbeatInterval (default: 30 seconds)
 */
const heartbeat = async (context) => {
  try {
    const timestamp = new Date().toISOString();
    const myriaStatus = await checkMyriaNodeHealth();
    
    return {
      timestamp,
      status: myriaStatus.healthy ? 'healthy' : 'unhealthy',
      myriaNode: myriaStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    };
  } catch (error) {
    console.error('Heartbeat error:', error);
    return {
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    };
  }
};

/**
 * Status Hook - Detailed status reporting
 * Called when status is requested via API
 */
const status = async (context) => {
  try {
    const myriaInfo = await getMyriaNodeInfo();
    const networkStatus = await getMyriaNetworkStatus();
    const systemStatus = await getSystemStatus();
    
    return {
      service: 'myria-node',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      myriaNode: myriaInfo,
      network: networkStatus,
      system: systemStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Status check error:', error);
    return {
      service: 'myria-node',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * OPTIONAL HOOKS
 * Implement these for enhanced monitoring and management
 */

/**
 * Ready Hook - Readiness check
 * Called to verify if the service is ready to accept traffic
 */
const ready = async (context) => {
  try {
    const isMyriaNodeReady = await checkMyriaNodeReady();
    const isSystemdReady = await checkSystemdReady();
    const isPortsOpen = await checkPortsOpen();
    
    return {
      ready: isMyriaNodeReady && isSystemdReady && isPortsOpen,
      checks: {
        myriaNode: isMyriaNodeReady,
        systemd: isSystemdReady,
        ports: isPortsOpen
      }
    };
  } catch (error) {
    return {
      ready: false,
      error: error.message
    };
  }
};

/**
 * Probe Hook - Liveness probe
 * Called to check if the service is alive
 */
const probe = async (context) => {
  try {
    const myriaAlive = await checkMyriaNodeAlive();
    
    return {
      alive: myriaAlive,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  } catch (error) {
    return {
      alive: false,
      error: error.message
    };
  }
};

/**
 * Metrics Hook - Performance metrics
 * Called to collect performance and operational metrics
 */
const metrics = async (context) => {
  try {
    const myriaMetrics = await getMyriaNodeMetrics();
    const systemMetrics = await getSystemMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      myria: myriaMetrics,
      system: systemMetrics
    };
  } catch (error) {
    console.error('Metrics collection error:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Validate Hook - Configuration validation
 * Called to validate service configuration
 */
const validate = async (context) => {
  try {
    const config = context.config;
    const validationResults = {
      valid: true,
      errors: []
    };
    
    // Validate Myria node configuration
    if (!config.myria?.network) {
      validationResults.errors.push('Myria network configuration is required');
      validationResults.valid = false;
    }
    
    if (!config.myria?.rpcPort || config.myria.rpcPort < 1 || config.myria.rpcPort > 65535) {
      validationResults.errors.push('Valid Myria RPC port is required');
      validationResults.valid = false;
    }
    
    if (!config.myria?.p2pPort || config.myria.p2pPort < 1 || config.myria.p2pPort > 65535) {
      validationResults.errors.push('Valid Myria P2P port is required');
      validationResults.valid = false;
    }
    
    return validationResults;
  } catch (error) {
    return {
      valid: false,
      errors: [error.message]
    };
  }
};

/**
 * HELPER FUNCTIONS
 * Myria node specific health checks and monitoring
 */

async function checkMyriaNodeHealth() {
  try {
    // Check if Myria node process is running
    const { stdout } = await execAsync('pgrep -f myria-node');
    const isRunning = stdout.trim().length > 0;
    
    if (!isRunning) {
      return {
        healthy: false,
        status: 'not_running',
        message: 'Myria node process not found'
      };
    }
    
    // Check if Myria node is responding
    const rpcResponse = await checkMyriaRPC();
    
    return {
      healthy: rpcResponse.success,
      status: rpcResponse.success ? 'running' : 'unresponsive',
      rpc: rpcResponse,
      processId: stdout.trim()
    };
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      error: error.message
    };
  }
}

async function checkMyriaRPC() {
  try {
    const { stdout } = await execAsync('curl -s -X POST -H "Content-Type: application/json" --data \'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}\' http://localhost:8545');
    const response = JSON.parse(stdout);
    
    return {
      success: response.result !== undefined,
      blockNumber: response.result,
      error: response.error
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function getMyriaNodeInfo() {
  try {
    // Get Myria node version
    const { stdout: versionOutput } = await execAsync('myria-node --version 2>/dev/null || echo "unknown"');
    
    // Get systemd service status
    const { stdout: serviceStatus } = await execAsync('systemctl is-active myria-node 2>/dev/null || echo "inactive"');
    
    return {
      version: versionOutput.trim(),
      serviceStatus: serviceStatus.trim(),
      dataDir: '/var/lib/myria-node',
      logDir: '/var/log/myria-node',
      rpcPort: 8545,
      p2pPort: 30303
    };
  } catch (error) {
    return {
      version: 'unknown',
      serviceStatus: 'error',
      error: error.message
    };
  }
}

async function getMyriaNetworkStatus() {
  try {
    // Check network connectivity
    const { stdout: peerCount } = await execAsync('curl -s -X POST -H "Content-Type: application/json" --data \'{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}\' http://localhost:8545 2>/dev/null | jq -r ".result" || echo "0"');
    
    // Check if node is syncing
    const { stdout: syncingStatus } = await execAsync('curl -s -X POST -H "Content-Type: application/json" --data \'{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}\' http://localhost:8545 2>/dev/null | jq -r ".result" || echo "false"');
    
    return {
      connected: true,
      peerCount: parseInt(peerCount) || 0,
      syncing: syncingStatus !== 'false',
      networkId: 1,
      chainId: '0x1'
    };
  } catch (error) {
    return {
      connected: false,
      peerCount: 0,
      syncing: false,
      error: error.message
    };
  }
}

async function getSystemStatus() {
  try {
    const { stdout: diskUsage } = await execAsync('df -h /var/lib/myria-node | tail -1 | awk \'{print $5}\'');
    const { stdout: memoryUsage } = await execAsync('free | grep Mem | awk \'{printf "%.1f", $3/$2 * 100.0}\'');
    
    return {
      diskUsage: diskUsage.trim(),
      memoryUsage: parseFloat(memoryUsage) || 0,
      uptime: process.uptime(),
      loadAverage: require('os').loadavg()
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

async function checkMyriaNodeReady() {
  try {
    const health = await checkMyriaNodeHealth();
    return health.healthy;
  } catch (error) {
    return false;
  }
}

async function checkSystemdReady() {
  try {
    const { stdout } = await execAsync('systemctl is-system-running 2>/dev/null || echo "unknown"');
    return stdout.trim() === 'running';
  } catch (error) {
    return false;
  }
}

async function checkPortsOpen() {
  try {
    const { stdout: rpcPort } = await execAsync('netstat -tlnp | grep :8545 | wc -l');
    const { stdout: p2pPort } = await execAsync('netstat -tlnp | grep :30303 | wc -l');
    
    return parseInt(rpcPort) > 0 && parseInt(p2pPort) > 0;
  } catch (error) {
    return false;
  }
}

async function checkMyriaNodeAlive() {
  try {
    const health = await checkMyriaNodeHealth();
    return health.healthy;
  } catch (error) {
    return false;
  }
}

async function getMyriaNodeMetrics() {
  try {
    const rpcResponse = await checkMyriaRPC();
    const networkStatus = await getMyriaNetworkStatus();
    
    return {
      rpcResponsive: rpcResponse.success,
      peerCount: networkStatus.peerCount,
      syncing: networkStatus.syncing,
      blockNumber: rpcResponse.blockNumber
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

async function getSystemMetrics() {
  try {
    const systemStatus = await getSystemStatus();
    
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      diskUsage: systemStatus.diskUsage,
      memoryUsage: systemStatus.memoryUsage,
      loadAverage: systemStatus.loadAverage
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * EXPORT HOOKS
 * Export the hooks needed for Myria node monitoring
 */
module.exports = {
  // Minimal required hooks
  heartbeat,
  status,
  
  // Optional hooks for enhanced monitoring
  ready,
  probe,
  metrics,
  validate
};
