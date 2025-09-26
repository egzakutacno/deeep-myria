# Myria Node with Riptide SDK Integration

This project integrates your Myria node with the Riptide SDK for enhanced monitoring, health checks, and management capabilities.

## 🚀 Quick Start

### 1. Build the Docker Image

```bash
# Build the Myria + Riptide SDK image
docker build -f Dockerfile-riptide -t myria-riptide-node .
```

### 2. Run the Container

```bash
# Run the container with systemd support
docker run --privileged --cgroupns=host \
  --name myria-riptide \
  --restart=always \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -d myria-riptide-node \
  /lib/systemd/systemd
```

### 3. Test the Integration

```bash
# Check container status
docker ps

# Enter the container
docker exec -it myria-riptide bash

# Check if services are running
systemctl status myria-riptide
systemctl status myria-node
```

## 📊 Monitoring Endpoints

The integrated system provides comprehensive monitoring endpoints:

### Riptide SDK Endpoints
- `GET /` - Service information
- `GET /health` - Health check
- `GET /status` - Detailed status
- `GET /metrics` - Performance metrics

### Myria Node Specific Endpoints
- `GET /myria/health` - Myria node health check
- `GET /myria/status` - Myria node detailed status
- `GET /myria/metrics` - Myria node metrics
- `GET /myria/ready` - Readiness check
- `GET /myria/live` - Liveness probe

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Key configuration options:
- `MYRIA_NETWORK` - Network type (mainnet/testnet)
- `MYRIA_RPC_PORT` - RPC port (default: 8545)
- `MYRIA_P2P_PORT` - P2P port (default: 30303)
- `RIPTIDE_ENABLED` - Enable Riptide SDK
- `RIPTIDE_HEARTBEAT_INTERVAL` - Heartbeat interval (ms)

### Riptide Configuration

Edit `riptide.config.json` to customize:
- Service name and version
- Heartbeat intervals
- Monitoring settings
- Myria node configuration

## 🎣 Hooks Implementation

The `hooks.js` file implements Riptide SDK hooks specifically for Myria node:

### Required Hooks
- **`heartbeat`** - Periodic health updates (every 30s)
- **`status`** - Detailed status reporting

### Optional Hooks
- **`ready`** - Readiness check for traffic acceptance
- **`probe`** - Liveness probe for container orchestration
- **`metrics`** - Performance and operational metrics
- **`validate`** - Configuration validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Riptide SDK   │    │   Express API   │    │   Myria Node    │
│                 │    │                 │    │                 │
│ • Heartbeat     │◄──►│ • Health checks │◄──►│ • RPC (8545)    │
│ • Status        │    │ • Metrics       │    │ • P2P (30303)   │
│ • Metrics       │    │ • Monitoring    │    │ • Data storage  │
│ • Validation    │    │ • Management    │    │ • Logs          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔍 Health Checks

The system provides multiple levels of health checking:

1. **Container Level** - Docker health check
2. **Service Level** - systemd service status
3. **Application Level** - Riptide SDK health checks
4. **Node Level** - Myria node RPC responses

## 📈 Metrics Collection

The system collects comprehensive metrics:

### Myria Node Metrics
- RPC responsiveness
- Peer count
- Sync status
- Block number

### System Metrics
- Memory usage
- CPU usage
- Disk usage
- Load average

## 🚀 Deployment

### Docker Compose (Recommended)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  myria-riptide:
    build:
      context: .
      dockerfile: Dockerfile-riptide
    container_name: myria-riptide
    privileged: true
    cgroupns: host
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:rw
      - myria-data:/var/lib/myria-node
      - myria-logs:/var/log/myria-node
    ports:
      - "3000:3000"   # Riptide API
      - "8545:8545"   # Myria RPC
      - "30303:30303" # Myria P2P
    environment:
      - NODE_ENV=production
      - RIPTIDE_ENABLED=true
    restart: unless-stopped

volumes:
  myria-data:
  myria-logs:
```

### Manual Deployment

```bash
# Build and run
docker build -f Dockerfile-riptide -t myria-riptide-node .
docker run --privileged --cgroupns=host --name myria-riptide --restart=always -v /sys/fs/cgroup:/sys/fs/cgroup -d myria-riptide-node /lib/systemd/systemd
```

## 🔧 Troubleshooting

### Check Container Status
```bash
docker ps
docker logs myria-riptide
```

### Check Services Inside Container
```bash
docker exec -it myria-riptide bash
systemctl status myria-riptide
systemctl status myria-node
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Myria node health
curl http://localhost:3000/myria/health

# Metrics
curl http://localhost:3000/metrics
```

### Common Issues

1. **Container won't start**: Check if systemd is properly configured
2. **Myria node not responding**: Check if Myria node service is running
3. **Port conflicts**: Ensure ports 3000, 8545, 30303 are available
4. **Permission issues**: Ensure container runs with `--privileged` flag

## 📚 API Documentation

### Health Check Response
```json
{
  "timestamp": "2025-01-26T10:30:00.000Z",
  "status": "healthy",
  "myriaNode": {
    "healthy": true,
    "status": "running",
    "rpc": {
      "success": true,
      "blockNumber": "0x123456"
    }
  },
  "uptime": 3600,
  "memory": {...},
  "pid": 1234
}
```

### Status Response
```json
{
  "service": "myria-node",
  "version": "1.0.0",
  "status": "running",
  "myriaNode": {
    "version": "1.0.0",
    "serviceStatus": "active",
    "rpcPort": 8545,
    "p2pPort": 30303
  },
  "network": {
    "connected": true,
    "peerCount": 25,
    "syncing": false
  },
  "system": {
    "diskUsage": "45%",
    "memoryUsage": 67.5,
    "uptime": 3600
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by NerdNode**

_This integration provides production-ready monitoring and management for your Myria node using the Riptide SDK._
