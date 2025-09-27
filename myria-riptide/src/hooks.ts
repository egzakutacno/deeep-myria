import type { HookContext } from '@deeep-network/riptide'
import { spawn } from 'child_process'

interface MyriaSecrets {
  apiKey?: string
}

let myriaSecrets: MyriaSecrets = {}

module.exports = {
  installSecrets: async ({ logger, secrets }: HookContext) => {
    logger.info('Installing Myria secrets')
    
    // Install Myria if not already installed
    try {
      await installMyriaIfNeeded(logger)
    } catch (error) {
      logger.error(`Failed to install Myria: ${error}`)
      return { success: false, error: `Myria installation failed: ${error}` }
    }
    
    // Check for API key in environment variables first
    const apiKey = process.env.MYRIA_API_KEY
    
    if (apiKey) {
      myriaSecrets.apiKey = apiKey
      logger.info('Myria API key found in environment variables')
      return { success: true }
    }
    
    // Fallback to secrets object if available
    if (secrets && secrets.MYRIA_API_KEY) {
      myriaSecrets.apiKey = secrets.MYRIA_API_KEY
      logger.info('Myria API key found in secrets')
      return { success: true }
    }
    
    logger.error('Myria API key not found in environment variables or secrets')
    return { success: false, error: 'MYRIA_API_KEY not provided' }
  },

  start: async ({ logger }: HookContext) => {
    logger.info('Starting Myria node')
    
    if (!myriaSecrets.apiKey) {
      logger.error('Cannot start Myria: API key not installed')
      return { success: false, error: 'API key not available' }
    }

    try {
      // Start Myria node with API key
      const result = await runMyriaCommand('--start', myriaSecrets.apiKey, logger)
      
      if (result.success) {
        logger.info('Myria node started successfully')
        return { success: true }
      } else {
        logger.error(`Failed to start Myria: ${result.error}`)
        return { success: false, error: result.error }
      }
    } catch (error) {
      logger.error(`Error starting Myria: ${error}`)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },

  health: async ({ logger }: HookContext) => {
    logger.debug('Checking Myria node health')
    
    try {
      // Get Myria status
      const result = await runMyriaCommand('--status', '', logger)
      
      if (result.success && result.output) {
        // Parse the status output to determine health
        const isHealthy = parseMyriaStatus(result.output)
        logger.debug(`Myria health check: ${isHealthy ? 'healthy' : 'unhealthy'}`)
        return isHealthy
      } else {
        logger.warn(`Health check failed: ${result.error}`)
        return false
      }
    } catch (error) {
      logger.error(`Health check error: ${error}`)
      return false
    }
  },

  stop: async ({ logger }: HookContext) => {
    logger.info('Stopping Myria node')
    
    if (!myriaSecrets.apiKey) {
      logger.error('Cannot stop Myria: API key not installed')
      return { success: false, error: 'API key not available' }
    }

    try {
      // Stop Myria node with API key
      const result = await runMyriaCommand('--stop', myriaSecrets.apiKey, logger)
      
      if (result.success) {
        logger.info('Myria node stopped successfully')
        return { success: true }
      } else {
        logger.error(`Failed to stop Myria: ${result.error}`)
        return { success: false, error: result.error }
      }
    } catch (error) {
      logger.error(`Error stopping Myria: ${error}`)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}

// Helper function to run Myria commands
async function runMyriaCommand(command: string, apiKey: string, logger: any): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    logger.debug(`Running: myria-node ${command}`)
    
    const myriaProcess = spawn('myria-node', [command], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let errorOutput = ''
    let apiKeySent = false

    myriaProcess.stdout.on('data', (data) => {
      const chunk = data.toString()
      output += chunk
      logger.debug(`Myria stdout: ${chunk}`)
      
      // Check if we see the API key prompt and haven't sent it yet
      if (chunk.includes('Enter the node API Key:') && !apiKeySent) {
        logger.debug('Sending API key to Myria...')
        myriaProcess.stdin.write(apiKey + '\n')
        apiKeySent = true
      }
    })

    myriaProcess.stderr.on('data', (data) => {
      const chunk = data.toString()
      errorOutput += chunk
      logger.debug(`Myria stderr: ${chunk}`)
    })

    // Fallback: send API key after a delay if prompt wasn't detected
    setTimeout(() => {
      if (!apiKeySent) {
        logger.debug('Sending API key (fallback timeout)...')
        myriaProcess.stdin.write(apiKey + '\n')
        apiKeySent = true
      }
    }, 2000)

    myriaProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output })
      } else {
        resolve({ success: false, error: errorOutput || `Process exited with code ${code}` })
      }
    })

    myriaProcess.on('error', (error) => {
      resolve({ success: false, error: error.message })
    })
  })
}

// Helper function to install Myria if needed
async function installMyriaIfNeeded(logger: any): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Myria is already installed
    const checkProcess = spawn('which', ['myria-node'])
    
    checkProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Myria already installed')
        resolve()
        return
      }
      
      // Myria not installed, install it now
      logger.info('Installing Myria...')
      const installProcess = spawn('wget', ['https://downloads-builds.myria.com/node/install.sh', '-O', '-'], {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      const bashProcess = spawn('bash', [], {
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      installProcess.stdout.pipe(bashProcess.stdin)
      
      let installOutput = ''
      bashProcess.stdout.on('data', (data) => {
        installOutput += data.toString()
        logger.debug(`Myria install: ${data.toString()}`)
      })
      
      bashProcess.stderr.on('data', (data) => {
        logger.debug(`Myria install stderr: ${data.toString()}`)
      })
      
      bashProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Myria installed successfully')
          resolve()
        } else {
          logger.error(`Myria installation failed with code ${code}`)
          reject(new Error(`Installation failed with code ${code}`))
        }
      })
      
      installProcess.on('error', (error) => {
        reject(error)
      })
    })
    
    checkProcess.on('error', (error) => {
      reject(error)
    })
  })
}

// Helper function to parse Myria status output
function parseMyriaStatus(statusOutput: string): boolean {
  try {
    // Look for status indicators in the output
    // Example: "Current Cycle Status: running"
    const statusMatch = statusOutput.match(/Current Cycle Status:\s*(\w+)/i)
    
    if (statusMatch) {
      const status = statusMatch[1].toLowerCase()
      return status === 'running'
    }
    
    // Fallback: check if we got node information
    return statusOutput.includes('Node ID:') && statusOutput.includes('Current Cycle Uptime:')
  } catch (error) {
    return false
  }
}
