# Myria Riptide Service

This is a Riptide SDK service that manages Myria nodes with proper lifecycle hooks for container orchestration.

## Features

- **Start Hook**: Starts Myria node with API key authentication
- **Stop Hook**: Stops Myria node gracefully
- **Health Hook**: Monitors Myria node status and uptime
- **Secrets Management**: Secure API key handling

## Configuration

The service requires the following environment variable:
- `MYRIA_API_KEY`: Your Myria node API key

## Usage

### Build the Service

```bash
npm install
npm run build
npm run build:docker
```

### Run Locally

```bash
docker run -e MYRIA_API_KEY=your-api-key reef-myria-riptide
```

### Run on VPS with Ubuntu 22.04

```bash
docker run --privileged --cgroupns=host \
  --name myria-riptide \
  --restart=always \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -e MYRIA_API_KEY=your-api-key \
  -d reef-myria-riptide
```

## Lifecycle Hooks

### installSecrets
- Installs the Myria API key from environment variables
- Validates that the API key is present

### start
- Runs `myria-node --start` with the API key
- Handles the interactive API key prompt automatically
- Returns success/failure status

### stop
- Runs `myria-node --stop` with the API key
- Handles the interactive API key prompt automatically
- Returns success/failure status

### health
- Runs `myria-node --status` to check node health
- Parses output to determine if node is running
- Looks for "Current Cycle Status: running" in output
- Returns boolean health status

## Status Output Parsing

The health check parses Myria status output like:
```
>>>[INFO] Getting node information... Please wait a moment...
>>>[INFO] Node ID: 423a09cf-b29c-47a0-be7b-6f80083fce92
>>>[INFO] Current Cycle Uptime: 21723
>>>[INFO] Current Cycle Status: running
```

## Integration with Coral Reef

This service is designed to work with the Coral Reef container orchestration platform, providing standardized lifecycle management for Myria nodes.
