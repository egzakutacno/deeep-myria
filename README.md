# Riptide Crypto Node Manager

A Docker container that integrates the @deeep-network/riptide SDK with a crypto node using systemd as PID 1. This setup ensures proper service management and interactive automation for crypto node operations.

## Architecture

- **Base Image**: `eniocarboni/docker-ubuntu-systemd:jammy` (Ubuntu 22.04 LTS with systemd)
- **PID 1**: systemd (not Riptide)
- **Service Management**: systemctl commands only
- **Interactive Automation**: Node.js child_process.spawn with state machine
- **Crypto Node**: Myria node software

## Features

- ✅ systemd as PID 1 for proper service management
- ✅ Riptide SDK integration with crypto node
- ✅ Interactive setup automation
- ✅ Multi-line output parsing (base64, hex keys)
- ✅ Service health monitoring
- ✅ Comprehensive logging
- ✅ CLI interface for management

## Quick Start

### 1. Build the Docker Image

```bash
docker build -t riptide-crypto-node .
```

### 2. Run the Container

```bash
docker run -d \
  --name riptide-crypto-node \
  --privileged \
  --cgroupns=host \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 8545:8545 \
  -p 30303:30303 \
  riptide-crypto-node
```

### 3. Enable Interactive Setup (Optional)

```bash
docker run -d \
  --name riptide-crypto-node \
  --privileged \
  --cgroupns=host \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -e INTERACTIVE_SETUP=true \
  -p 3000:3000 \
  -p 8080:8080 \
  -p 8545:8545 \
  -p 30303:30303 \
  riptide-crypto-node
```

## Docker Compose

Use the provided `docker-compose.yml` for easier deployment:

```bash
docker-compose up -d
```

## Usage

### CLI Commands

Access the container and use the CLI:

```bash
# Enter the container
docker exec -it riptide-crypto-node bash

# Check crypto node status
node /app/src/index.js status

# Get crypto node logs
node /app/src/index.js logs -n 50

# Restart crypto node
node /app/src/index.js restart

# Start Riptide manager
node /app/src/index.js start
```

### Service Management

```bash
# Check Riptide service status
systemctl status riptide.service

# Check Myria node service status
systemctl status myria-node.service

# View Riptide logs
journalctl -u riptide.service -f

# View Myria node logs
journalctl -u myria-node.service -f
```

## Configuration

### Environment Variables

- `NODE_ENV`: Node.js environment (default: production)
- `RIPTIDE_SERVICE_NAME`: Riptide service name (default: riptide)
- `CRYPTO_NODE_SERVICE`: Crypto node service name (default: myria-node)
- `INTERACTIVE_SETUP`: Enable interactive setup (default: false)

### Ports

- `3000`: Riptide API port
- `8080`: Riptide WebSocket port
- `8545`: Myria node RPC port
- `30303`: Myria node P2P port

## File Structure

```
/app/
├── src/
│   └── index.js              # Main Riptide application
├── scripts/
│   ├── setup-crypto-node.sh  # Interactive setup script
│   └── start-riptide.sh      # Startup script
├── riptide.service           # Riptide systemd service
├── package.json              # Node.js dependencies
└── Dockerfile                # Docker configuration
```

## Riptide Hooks

The application provides the following Riptide hooks:

- `startCryptoNode`: Start the crypto node
- `stopCryptoNode`: Stop the crypto node
- `restartCryptoNode`: Restart the crypto node
- `checkCryptoNodeStatus`: Get crypto node status
- `getCryptoNodeLogs`: Get crypto node logs

## Interactive Setup

When `INTERACTIVE_SETUP=true`, the container will:

1. Install Myria node software
2. Create systemd service for Myria node
3. Prompt for configuration (node name, network, ports)
4. Extract and display keys from setup output
5. Start the crypto node service

## Logging

Logs are available in multiple locations:

- Riptide logs: `/var/log/riptide/riptide.log`
- Setup logs: `/var/log/riptide/setup.log`
- Startup logs: `/var/log/riptide/startup.log`
- Systemd logs: `journalctl -u riptide.service`
- Myria node logs: `journalctl -u myria-node.service`

## Troubleshooting

### Container won't start

1. Ensure you're using the correct run command with `--privileged` and `--cgroupns=host`
2. Check systemd logs: `docker logs riptide-crypto-node`
3. Verify the base image: `eniocarboni/docker-ubuntu-systemd:jammy`

### Crypto node not starting

1. Check Myria node service: `systemctl status myria-node.service`
2. View Myria node logs: `journalctl -u myria-node.service -f`
3. Verify Myria node installation: `which myria-node`

### Riptide not responding

1. Check Riptide service: `systemctl status riptide.service`
2. View Riptide logs: `journalctl -u riptide.service -f`
3. Check application logs: `tail -f /var/log/riptide/riptide.log`

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Building

```bash
# Build Docker image
docker build -t riptide-crypto-node .

# Build with specific tag
docker build -t riptide-crypto-node:latest .
```

## Security Considerations

- The container runs with `--privileged` for systemd functionality
- Services run as root for systemd compatibility
- Consider security implications for production deployments
- Review and customize the systemd service configurations

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs
3. Open an issue on the repository
4. Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Riptide SDK integration
- systemd as PID 1
- Interactive setup automation
- Myria node support
- Comprehensive logging
- CLI interface
