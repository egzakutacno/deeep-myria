# Myria Riptide Integration

A production-ready Docker container that integrates Myria node software with the Riptide SDK for container orchestration and lifecycle management.

## Overview

This project provides a complete implementation of Myria node management using the `@deeep-network/riptide` SDK, designed for integration with NerdNode's container orchestration platform (Hashicorp Nomad).

## Features

- **Complete Riptide SDK Integration** - All required lifecycle hooks implemented
- **Myria Node Management** - Automatic installation and lifecycle control
- **Reward Tracking** - Built-in monitoring for daily reward eligibility (6-hour minimum)
- **Production Ready** - systemd-based container with proper service management
- **Orchestrator Compatible** - HTTP API endpoints for monitoring and control

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Orchestrator  │◄──►│  Riptide Service │◄──►│  Myria Node     │
│   (Nomad)       │    │  (Port 3000)     │    │  (systemd)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implemented Hooks

| Hook | Purpose | Status |
|------|---------|--------|
| `installSecrets` | Receives API key from orchestrator | ✅ Ready |
| `start` | Starts Myria node with API key | ✅ Working |
| `health` | Checks Myria node health status | ✅ Working |
| `stop` | Stops Myria node with API key | ✅ Working |
| `heartbeat` | Provides monitoring data + reward tracking | ✅ Working |
| `status` | Returns comprehensive service status | ✅ Working |

## Quick Start

### Build the Container

```bash
git clone https://github.com/egzakutacno/deeep-myria.git
cd deeep-myria
docker build -t reef-myria-riptide -f myria-riptide/Dockerfile myria-riptide/
```

### Run the Container

```bash
docker run --privileged --cgroupns=host \
  --name myria-riptide \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -e MYRIA_API_KEY="your-api-key-here" \
  -d reef-myria-riptide
```

## API Endpoints

The Riptide service exposes the following HTTP endpoints:

- `GET /health` - Service health check
- `GET /status` - Detailed service status
- `POST /api/secrets` - Secret injection (orchestrator integration)

## Heartbeat Data

The heartbeat hook provides comprehensive monitoring data:

```json
{
  "timestamp": "2025-09-27T10:30:00.000Z",
  "service": "myria-riptide",
  "healthy": true,
  "myriaStatus": "Current Cycle Status: running",
  "apiKeyInstalled": true,
  "uptimeSeconds": 34323,
  "uptimeHours": "9.54",
  "rewardEligible": true
}
```

## Reward Tracking

The service automatically tracks Myria node uptime and determines daily reward eligibility:

- **Minimum Requirement**: 6 hours (21,600 seconds) per day
- **Real-time Monitoring**: Heartbeat data includes current uptime and eligibility status
- **Orchestrator Integration**: Perfect for monitoring multiple nodes across infrastructure

## Integration with NerdNode

This implementation is designed for integration with NerdNode's orchestrator platform. Key integration points:

1. **Secret Management**: Orchestrator sends API keys via HTTP API or environment variables
2. **Health Monitoring**: Continuous heartbeat data for orchestrator monitoring
3. **Lifecycle Management**: Complete start/stop/health control via Riptide hooks
4. **Reward Tracking**: Built-in monitoring for reward eligibility compliance

## Development

### Project Structure

```
myria-riptide/
├── src/
│   └── hooks.ts          # Riptide lifecycle hooks implementation
├── Dockerfile            # Container definition
├── package.json          # Node.js dependencies
├── riptide.config.json   # Riptide service configuration
└── README.md             # Detailed documentation
```

### Building

```bash
cd myria-riptide
npm install
npm run build
```

## Requirements

- Docker with systemd support
- `--privileged` flag for systemd functionality
- cgroup namespace access (`--cgroupns=host` for Ubuntu 22.04 hosts)

## License

This project is part of the NerdNode ecosystem integration.

## Support

For integration questions or issues, contact the NerdNode development team.