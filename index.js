/**
 * Main Entry Point for Myria Node with Riptide SDK Integration
 * 
 * This integrates the Riptide SDK with your Myria node for enhanced
 * monitoring, health checks, and management capabilities.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RiptideSDK } = require('@deeep-network/riptide');
const hooks = require('./hooks');
const config = require('./riptide.config.json');

const app = express();
const PORT = process.env.PORT || config.service.port || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Riptide SDK
const riptide = new RiptideSDK({
  config: config.riptide,
  hooks: hooks
});

// Myria Node specific endpoints
app.get('/myria/health', async (req, res) => {
  try {
    const myriaHealth = await hooks.heartbeat();
    res.json({
      service: 'myria-node',
      ...myriaHealth,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      service: 'myria-node',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Myria Node status endpoint
app.get('/myria/status', async (req, res) => {
  try {
    const status = await hooks.status();
    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      service: 'myria-node',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Myria Node metrics endpoint
app.get('/myria/metrics', async (req, res) => {
  try {
    if (hooks.metrics) {
      const metrics = await hooks.metrics();
      res.json(metrics);
    } else {
      res.json({ message: 'Metrics hook not implemented' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Myria Node readiness check
app.get('/myria/ready', async (req, res) => {
  try {
    if (hooks.ready) {
      const readyStatus = await hooks.ready();
      res.status(readyStatus.ready ? 200 : 503).json(readyStatus);
    } else {
      res.json({ ready: true, message: 'Ready hook not implemented' });
    }
  } catch (error) {
    res.status(503).json({ 
      ready: false, 
      error: error.message 
    });
  }
});

// Myria Node liveness probe
app.get('/myria/live', async (req, res) => {
  try {
    if (hooks.probe) {
      const probeStatus = await hooks.probe();
      res.status(probeStatus.alive ? 200 : 503).json(probeStatus);
    } else {
      res.json({ alive: true, message: 'Probe hook not implemented' });
    }
  } catch (error) {
    res.status(503).json({ 
      alive: false, 
      error: error.message 
    });
  }
});

// Myria Node lifecycle endpoints
app.post('/myria/start', async (req, res) => {
  try {
    if (hooks.start) {
      const startResult = await hooks.start();
      res.status(startResult.success ? 200 : 500).json(startResult);
    } else {
      res.status(501).json({ 
        success: false, 
        error: 'Start hook not implemented' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/myria/stop', async (req, res) => {
  try {
    if (hooks.stop) {
      const stopResult = await hooks.stop();
      res.status(stopResult.success ? 200 : 500).json(stopResult);
    } else {
      res.status(501).json({ 
        success: false, 
        error: 'Stop hook not implemented' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Install secrets endpoint
app.post('/myria/secrets', async (req, res) => {
  try {
    if (hooks.installSecrets) {
      const secrets = req.body.secrets || {};
      const installResult = await hooks.installSecrets({ secrets });
      res.status(installResult.success ? 200 : 500).json(installResult);
    } else {
      res.status(501).json({ 
        success: false, 
        error: 'InstallSecrets hook not implemented' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Riptide SDK endpoints
app.get('/health', async (req, res) => {
  try {
    const status = await hooks.status();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/metrics', async (req, res) => {
  try {
    if (hooks.metrics) {
      const metrics = await hooks.metrics();
      res.json(metrics);
    } else {
      res.json({ message: 'Metrics hook not implemented' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/status', async (req, res) => {
  try {
    const status = await hooks.status();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Service information endpoint
app.get('/', (req, res) => {
  res.json({
    service: config.service.name,
    version: config.service.version,
    description: config.service.description,
    status: 'running',
    myriaNode: {
      rpcPort: config.myria.rpcPort,
      p2pPort: config.myria.p2pPort,
      network: config.myria.network
    },
    endpoints: {
      health: '/health',
      status: '/status',
      metrics: '/metrics',
      myriaHealth: '/myria/health',
      myriaStatus: '/myria/status',
      myriaMetrics: '/myria/metrics',
      myriaReady: '/myria/ready',
      myriaLive: '/myria/live',
      myriaStart: '/myria/start',
      myriaStop: '/myria/stop',
      myriaSecrets: '/myria/secrets'
    },
    timestamp: new Date().toISOString()
  });
});

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Myria Node with Riptide SDK integration...');
    
    // Initialize Riptide SDK
    await riptide.initialize();
    console.log('✅ Riptide SDK initialized successfully');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Myria Node Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
      console.log(`ℹ️  Status: http://localhost:${PORT}/status`);
      console.log(`🔗 Myria Health: http://localhost:${PORT}/myria/health`);
      console.log(`🔗 Myria Status: http://localhost:${PORT}/myria/status`);
      console.log(`🔗 Myria Metrics: http://localhost:${PORT}/myria/metrics`);
      console.log(`🔗 Myria Ready: http://localhost:${PORT}/myria/ready`);
      console.log(`🔗 Myria Live: http://localhost:${PORT}/myria/live`);
      console.log(`🔗 Myria Start: http://localhost:${PORT}/myria/start`);
      console.log(`🔗 Myria Stop: http://localhost:${PORT}/myria/stop`);
      console.log(`🔗 Myria Secrets: http://localhost:${PORT}/myria/secrets`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await riptide.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await riptide.shutdown();
  process.exit(0);
});

// Start the application
startServer();
