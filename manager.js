#!/usr/bin/env node

/**
 * Riptide Manager for Myria Node Integration
 * 
 * This script initializes and starts the Riptide SDK with the provided
 * configuration and hooks. It's designed to run as a systemd service.
 */

const Riptide = require('@deeep-network/riptide');
const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'riptide.config.json');
const hooksPath = path.join(__dirname, 'hooks.js');

console.log('[MANAGER] Starting Riptide Manager for Myria Node Integration');
console.log('[MANAGER] Config path:', configPath);
console.log('[MANAGER] Hooks path:', hooksPath);

// Validate configuration file exists
if (!fs.existsSync(configPath)) {
    console.error('[MANAGER] ERROR: Configuration file not found at:', configPath);
    process.exit(1);
}

// Validate hooks file exists
if (!fs.existsSync(hooksPath)) {
    console.error('[MANAGER] ERROR: Hooks file not found at:', hooksPath);
    process.exit(1);
}

// Load configuration
let config;
try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('[MANAGER] Configuration loaded successfully');
} catch (error) {
    console.error('[MANAGER] ERROR: Failed to load configuration:', error.message);
    process.exit(1);
}

// Load hooks
let hooks;
try {
    hooks = require(hooksPath);
    console.log('[MANAGER] Hooks loaded successfully');
} catch (error) {
    console.error('[MANAGER] ERROR: Failed to load hooks:', error.message);
    process.exit(1);
}

// Validate required hooks
const requiredHooks = ['onStartup', 'onShutdown', 'onNewBlock', 'onNewTransaction', 'onError', 'onHealthCheck'];
const missingHooks = requiredHooks.filter(hook => typeof hooks[hook] !== 'function');

if (missingHooks.length > 0) {
    console.error('[MANAGER] ERROR: Missing required hooks:', missingHooks);
    process.exit(1);
}

// Create logs directory if it doesn't exist
const logsDir = '/var/log/myria';
if (!fs.existsSync(logsDir)) {
    try {
        fs.mkdirSync(logsDir, { recursive: true });
        console.log('[MANAGER] Created logs directory:', logsDir);
    } catch (error) {
        console.error('[MANAGER] WARNING: Failed to create logs directory:', error.message);
    }
}

// Initialize Riptide SDK
let riptide;
try {
    console.log('[MANAGER] Initializing Riptide SDK...');
    
    // Create Riptide instance with configuration
    riptide = new Riptide({
        ...config,
        hooks: hooks
    });
    
    console.log('[MANAGER] Riptide SDK initialized successfully');
} catch (error) {
    console.error('[MANAGER] ERROR: Failed to initialize Riptide SDK:', error.message);
    process.exit(1);
}

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    console.log(`[MANAGER] Received ${signal}, initiating graceful shutdown...`);
    
    try {
        if (riptide) {
            console.log('[MANAGER] Stopping Riptide SDK...');
            await riptide.stop();
            console.log('[MANAGER] Riptide SDK stopped successfully');
        }
        
        console.log('[MANAGER] Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('[MANAGER] ERROR during graceful shutdown:', error.message);
        process.exit(1);
    }
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('[MANAGER] Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('[MANAGER] Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start Riptide SDK
async function startRiptide() {
    try {
        console.log('[MANAGER] Starting Riptide SDK...');
        
        // Start the Riptide instance
        await riptide.start();
        
        console.log('[MANAGER] Riptide SDK started successfully');
        console.log('[MANAGER] Manager is now running and monitoring Myria node');
        
        // Log startup event
        const startupLog = {
            timestamp: new Date().toISOString(),
            event: 'manager_started',
            config: config,
            pid: process.pid
        };
        
        try {
            await fs.promises.appendFile(
                path.join(logsDir, 'manager.log'),
                JSON.stringify(startupLog) + '\n'
            );
        } catch (logError) {
            console.error('[MANAGER] WARNING: Failed to write startup log:', logError.message);
        }
        
    } catch (error) {
        console.error('[MANAGER] ERROR: Failed to start Riptide SDK:', error.message);
        console.error('[MANAGER] Stack trace:', error.stack);
        
        // Log error event
        const errorLog = {
            timestamp: new Date().toISOString(),
            event: 'manager_startup_error',
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        };
        
        try {
            await fs.promises.appendFile(
                path.join(logsDir, 'manager.log'),
                JSON.stringify(errorLog) + '\n'
            );
        } catch (logError) {
            console.error('[MANAGER] Failed to write error log:', logError.message);
        }
        
        process.exit(1);
    }
}

// Start the manager
startRiptide().catch((error) => {
    console.error('[MANAGER] Fatal error in startRiptide:', error);
    process.exit(1);
});
