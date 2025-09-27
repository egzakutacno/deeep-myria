# Myria Docker Container with systemd

This repository contains a Docker container setup for running Myria software with systemd support, based on the [docker-ubuntu-systemd](https://github.com/eniocarboni/docker-ubuntu-systemd) pattern.

## Features

- Ubuntu 22.04 LTS base image
- systemd support for running services
- Pre-configured Myria node setup
- Docker Compose support for easy deployment
- Health checks and monitoring
- Proper security configurations

## Prerequisites

- Docker
- Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/egzakutacno/deeep-myria.git
cd deeep-myria
```

### 2. Build the Container

```bash
chmod +x build.sh
./build.sh
```

### 3. Deploy with Docker Compose

```bash
chmod +x deploy.sh
./deploy.sh
```

## Manual Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d --build

# View logs
docker-compose logs -f myria

# Stop the container
docker-compose down
```

### Using Docker directly

```bash
# Build the image
docker build -t myria-systemd:latest .

# Run the container
docker run --privileged -d \
  --name myria-container \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  -p 8080:8080 \
  -p 9090:9090 \
  myria-systemd:latest
```

## Configuration

### Environment Variables

- `NODE_ENV`: Set to `production` for production deployment
- `MYRIA_DATA_DIR`: Path to Myria data directory (default: `/var/lib/myria`)
- `MYRIA_LOG_DIR`: Path to Myria log directory (default: `/var/log/myria`)

### Ports

- `8080`: Myria network port
- `9090`: Myria API port

### Volumes

- `/var/lib/myria`: Myria data directory
- `/var/log/myria`: Myria log directory
- `/opt/myria/config`: Configuration files (optional)

## Myria Service Management

The container runs systemd, so you can manage the Myria service using systemctl:

```bash
# Access the container
docker exec -it myria-container bash

# Check service status
systemctl status myria.service

# View service logs
journalctl -u myria.service -f

# Restart service
systemctl restart myria.service
```

## Customization

### Installing Custom Myria Software

To install a specific version of Myria software, edit the `scripts/install-myria.sh` file and replace the placeholder installation commands with the actual installation steps for your Myria software.

### Configuration Files

Configuration files can be placed in the `config/` directory and will be mounted into the container at `/opt/myria/config`.

### systemd Service

The systemd service file is located at `systemd/myria.service`. You can modify this file to customize the service behavior.

## Security Considerations

- The container runs with `--privileged` flag to support systemd
- Proper user isolation is implemented with the `myria` user
- Security settings are configured in the systemd service file
- Sensitive directories are protected with appropriate permissions

## Troubleshooting

### Container Won't Start

1. Check Docker logs: `docker-compose logs myria`
2. Verify systemd is running: `docker exec myria-container systemctl status`
3. Check service status: `docker exec myria-container systemctl status myria.service`

### Service Issues

1. View service logs: `journalctl -u myria.service -f`
2. Check configuration: `cat /var/lib/myria/config/node.conf`
3. Verify permissions: `ls -la /var/lib/myria/`

### Network Issues

1. Verify ports are accessible: `netstat -tlnp | grep :8080`
2. Check firewall settings on the host
3. Verify container networking: `docker network ls`

## Development

### Building for Different Architectures

```bash
# Build for ARM64
docker buildx build --platform linux/arm64 -t myria-systemd:arm64 .

# Build for AMD64
docker buildx build --platform linux/amd64 -t myria-systemd:amd64 .
```

### Pushing to Registry

```bash
# Tag for GitHub Container Registry
docker tag myria-systemd:latest ghcr.io/egzakutacno/deeep-myria:latest

# Push to registry
docker push ghcr.io/egzakutacno/deeep-myria:latest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the changes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Based on [docker-ubuntu-systemd](https://github.com/eniocarboni/docker-ubuntu-systemd) by eniocarboni
- Inspired by the need for systemd support in Docker containers
