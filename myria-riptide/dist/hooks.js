"use strict";

// src/hooks.ts
var import_child_process = require("child_process");
var myriaSecrets = {};
module.exports = {
  installSecrets: async ({ logger, secrets }) => {
    logger.info("Installing Myria secrets");
    try {
      await installMyriaIfNeeded(logger);
    } catch (error) {
      logger.error(`Failed to install Myria: ${error}`);
      return { success: false, error: `Myria installation failed: ${error}` };
    }
    if (secrets && secrets.MYRIA_API_KEY) {
      myriaSecrets.apiKey = secrets.MYRIA_API_KEY;
      logger.info("Myria API key installed successfully");
      return { success: true };
    } else {
      logger.error("Myria API key not found in secrets");
      return { success: false, error: "MYRIA_API_KEY not provided" };
    }
  },
  start: async ({ logger }) => {
    logger.info("Starting Myria node");
    if (!myriaSecrets.apiKey) {
      logger.error("Cannot start Myria: API key not installed");
      return { success: false, error: "API key not available" };
    }
    try {
      const result = await runMyriaCommand("--start", myriaSecrets.apiKey, logger);
      if (result.success) {
        logger.info("Myria node started successfully");
        return { success: true };
      } else {
        logger.error(`Failed to start Myria: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error(`Error starting Myria: ${error}`);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
  health: async ({ logger }) => {
    logger.debug("Checking Myria node health");
    try {
      const result = await runMyriaCommand("--status", "", logger);
      if (result.success && result.output) {
        const isHealthy = parseMyriaStatus(result.output);
        logger.debug(`Myria health check: ${isHealthy ? "healthy" : "unhealthy"}`);
        return isHealthy;
      } else {
        logger.warn(`Health check failed: ${result.error}`);
        return false;
      }
    } catch (error) {
      logger.error(`Health check error: ${error}`);
      return false;
    }
  },
  stop: async ({ logger }) => {
    logger.info("Stopping Myria node");
    if (!myriaSecrets.apiKey) {
      logger.error("Cannot stop Myria: API key not installed");
      return { success: false, error: "API key not available" };
    }
    try {
      const result = await runMyriaCommand("--stop", myriaSecrets.apiKey, logger);
      if (result.success) {
        logger.info("Myria node stopped successfully");
        return { success: true };
      } else {
        logger.error(`Failed to stop Myria: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      logger.error(`Error stopping Myria: ${error}`);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
};
async function runMyriaCommand(command, apiKey, logger) {
  return new Promise((resolve) => {
    logger.debug(`Running: myria-node ${command}`);
    const myriaProcess = (0, import_child_process.spawn)("myria-node", [command], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let output = "";
    let errorOutput = "";
    myriaProcess.stdout.on("data", (data) => {
      const chunk = data.toString();
      output += chunk;
      logger.debug(`Myria stdout: ${chunk}`);
    });
    myriaProcess.stderr.on("data", (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      logger.debug(`Myria stderr: ${chunk}`);
    });
    myriaProcess.stdin.write(apiKey + "\n");
    myriaProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, error: errorOutput || `Process exited with code ${code}` });
      }
    });
    myriaProcess.on("error", (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}
async function installMyriaIfNeeded(logger) {
  return new Promise((resolve, reject) => {
    const checkProcess = (0, import_child_process.spawn)("which", ["myria-node"]);
    checkProcess.on("close", (code) => {
      if (code === 0) {
        logger.info("Myria already installed");
        resolve();
        return;
      }
      logger.info("Installing Myria...");
      const installProcess = (0, import_child_process.spawn)("wget", ["https://downloads-builds.myria.com/node/install.sh", "-O", "-"], {
        stdio: ["ignore", "pipe", "pipe"]
      });
      const bashProcess = (0, import_child_process.spawn)("bash", [], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      installProcess.stdout.pipe(bashProcess.stdin);
      let installOutput = "";
      bashProcess.stdout.on("data", (data) => {
        installOutput += data.toString();
        logger.debug(`Myria install: ${data.toString()}`);
      });
      bashProcess.stderr.on("data", (data) => {
        logger.debug(`Myria install stderr: ${data.toString()}`);
      });
      bashProcess.on("close", (code2) => {
        if (code2 === 0) {
          logger.info("Myria installed successfully");
          resolve();
        } else {
          logger.error(`Myria installation failed with code ${code2}`);
          reject(new Error(`Installation failed with code ${code2}`));
        }
      });
      installProcess.on("error", (error) => {
        reject(error);
      });
    });
    checkProcess.on("error", (error) => {
      reject(error);
    });
  });
}
function parseMyriaStatus(statusOutput) {
  try {
    const statusMatch = statusOutput.match(/Current Cycle Status:\s*(\w+)/i);
    if (statusMatch) {
      const status = statusMatch[1].toLowerCase();
      return status === "running";
    }
    return statusOutput.includes("Node ID:") && statusOutput.includes("Current Cycle Uptime:");
  } catch (error) {
    return false;
  }
}
//# sourceMappingURL=hooks.js.map