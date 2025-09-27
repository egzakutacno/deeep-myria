# Myria Riptide Integration

A complete integration of the Myria crypto node with the NerdNode Riptide SDK, running in a Docker container with systemd as PID 1.

## Overview

This project provides a containerized solution that:
- Runs Myria node as a systemd service
- Integrates with Riptide SDK for blockchain monitoring
- Uses systemd for service orchestration and management
- Provides comprehensive logging and monitoring capabilities

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                         │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   systemd (PID1)│    │        Application Layer        │ │
│  │                 │    │                                 │ │
│  │  ┌─────────────┐│    │  ┌─────────────┐ ┌─────────────┐│ │
│  │  │myria.service││    │  │manager.js   │ │hooks.js     ││ │
│  │  └─────────────┘│    │  └─────────────┘ └─────────────┘│ │
│  │                 │    │                                 │ │
│  │  ┌─────────────┐│    │  ┌─────────────┐ ┌─────────────┐│ │
│  │  │riptide-     ││    │  │run-riptide  │ │riptide      ││ │
│  │  │manager      ││    │  │.sh          │ │.config.json ││ │
│  │  │.service     ││    │  └─────────────┘ └─────────────┘│ │
│  │  └─────────────┘│    │                                 │ │
│  └─────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Build the Docker Image

```bash
docker build -t myria-riptide .
```

### Run the Container

```bash
docker run --privileged --cgroupns=host \
  --name myria-riptide \
  --restart=always \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  -d myria-riptide \
  /lib/systemd/systemd
```

### Check Service Status

```bash
# Check Myria node status
docker exec myria-riptide systemctl status myria.service

# Check Riptide manager status
docker exec myria-riptide systemctl status myria-riptide-manager.service

# View logs
docker exec myria-riptide ./run-riptide.sh logs
```

## File Structure

```
.
├── Dockerfile                          # Container definition
├── package.json                        # Node.js dependencies
├── riptide.config.json                 # Riptide SDK configuration
├── manager.js                          # Main Riptide manager
├── run-riptide.sh                      # Service wrapper script
├── myria.service                       # Myria node systemd service
├── myria-riptide-manager.service       # Riptide manager systemd service
└── src/
    └── hooks.js                        # Riptide event hooks
```

## Configuration

### Riptide Configuration

Edit `riptide.config.json` to customize:
- Network settings (RPC URL, chain ID, etc.)
- Monitoring intervals and health checks
- Logging levels and output destinations
- Event filters and handlers
- API settings and security

### Hooks Customization

Modify `src/hooks.js` to implement your specific logic:
- `onStartup()` - Called when Riptide starts
- `onShutdown()` - Called when Riptide stops
- `onNewBlock()` - Called when new blocks are detected
- `onNewTransaction()` - Called when new transactions are detected
- `onError()` - Called when errors occur
- `onHealthCheck()` - Called for health status checks

## Service Management

### Using systemctl (inside container)

```bash
# Start services
docker exec myria-riptide systemctl start myria.service
docker exec myria-riptide systemctl start myria-riptide-manager.service

# Stop services
docker exec myria-riptide systemctl stop myria-riptide-manager.service
docker exec myria-riptide systemctl stop myria.service

# Restart services
docker exec myria-riptide systemctl restart myria.service
docker exec myria-riptide systemctl restart myria-riptide-manager.service

# Check status
docker exec myria-riptide systemctl status myria.service
docker exec myria-riptide systemctl status myria-riptide-manager.service
```

### Using the Wrapper Script

```bash
# Start Riptide manager
docker exec myria-riptide ./run-riptide.sh start

# Stop Riptide manager
docker exec myria-riptide ./run-riptide.sh stop

# Restart Riptide manager
docker exec myria-riptide ./run-riptide.sh restart

# Check status
docker exec myria-riptide ./run-riptide.sh status

# View logs
docker exec myria-riptide ./run-riptide.sh logs 100
```

## Logging

Logs are stored in `/var/log/myria/`:
- `riptide.log` - Main Riptide SDK logs
- `manager.log` - Manager application logs
- `blocks.log` - Block event logs
- `transactions.log` - Transaction event logs
- `errors.log` - Error logs

## Monitoring

### Health Checks

The system includes built-in health checks:
- Myria node connectivity
- Riptide SDK status
- Service dependencies
- Resource usage

### Metrics

If enabled in configuration, metrics are available at:
- `http://localhost:9090/metrics` - Prometheus format

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check service logs
   docker exec myria-riptide journalctl -u myria.service -f
   docker exec myria-riptide journalctl -u myria-riptide-manager.service -f
   ```

2. **Permission issues**
   ```bash
   # Ensure proper permissions
   docker exec myria-riptide chmod +x /root/run-riptide.sh
   docker exec myria-riptide chown -R root:root /var/log/myria
   ```

3. **Network connectivity**
   ```bash
   # Test network connectivity
   docker exec myria-riptide curl -f http://localhost:8545
   ```

### Debug Mode

Enable debug logging by modifying `riptide.config.json`:
```json
{
  "logging": {
    "level": "debug"
  },
  "development": {
    "enabled": true,
    "debug": true
  }
}
```

## Development

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Modify configuration and hooks as needed
4. Test locally: `npm start`

### Building and Testing

```bash
# Build the image
docker build -t myria-riptide .

# Run tests
docker run --rm myria-riptide npm test

# Run with debug
docker run --rm -it myria-riptide npm run dev
```

## Security Considerations

- The container runs with `--privileged` flag for systemd functionality
- Services run as root user (required for systemd)
- Network ports are exposed (3000, 8080, 9090)
- Consider implementing authentication for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/myria/myria-riptide-integration/issues
- Documentation: https://docs.myria.com/
- Riptide SDK: https://github.com/deeep-network/riptide
