# Deep Myria Docker Container

This Docker container provides Ubuntu 22.04 with systemd support and pre-installed Myria node software.

## Features

- Ubuntu 20.04 base image with systemd support
- Pre-installed Myria node software
- Optimized for container deployment
- Compatible with Ubuntu 20.04 and 22.04 hosts
- Based on proven working setup from omnia repository

**Note**: Uses the same approach as the working omnia setup - installs Myria during Docker build using the eniocarboni/docker-ubuntu-systemd:focal base image.

## Building the Container

To build the container on your VPS:

```bash
git clone https://github.com/egzakutacno/deeep-myria.git
cd deeep-myria
docker build -t deep-myria .
```

## Running the Container

### Basic Usage (Original Pattern)

```bash
docker run --detach --privileged --volume=/sys/fs/cgroup:/sys/fs/cgroup:ro deep-myria
```

### Enhanced Usage (With Myria Ports)

```bash
docker run -d \
  --name myria-node \
  --privileged \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  -p 8333:8333 \
  -p 8334:8334 \
  -p 8335:8335 \
  deep-myria
```

### Ubuntu 22.04 Host Fix (If Needed)

If you're running on Ubuntu 22.04 host and experiencing issues, use:

```bash
docker run --privileged --cgroupns=host \
  --name myria-node \
  --restart=always \
  -v /sys/fs/cgroup:/sys/fs/cgroup \
  -d deep-myria \
  /lib/systemd/systemd
```

### Advanced Usage with Volume Persistence

```bash
docker run -d \
  --name myria-node \
  --privileged \
  --restart unless-stopped \
  -v /sys/fs/cgroup:/sys/fs/cgroup:ro \
  -v myria-data:/home/myria/.myria \
  -p 8333:8333 \
  -p 8334:8334 \
  -p 8335:8335 \
  deep-myria
```

## Important Notes

- The container requires `--privileged` flag to run systemd
- Mount `/sys/fs/cgroup` as read-only for proper systemd functionality
- Consider using volume mounts for data persistence
- Default ports: 8333, 8334, 8335 (adjust as needed)

## Managing Myria Services

**Important**: Myria will be automatically installed on the first container startup. This may take a few minutes.

Once the container is running, you can manage Myria services:

```bash
# Enter the container
docker exec -it myria-node bash

# Check if Myria was installed
which myria
myria --version

# Check Myria status
systemctl status myria

# Start Myria service
systemctl start myria

# Stop Myria service
systemctl stop myria

# Restart Myria service
systemctl restart myria
```

## Security Considerations

- The container creates a `myria` user for running services
- Consider running with `--user myria` for additional security
- Regularly update the base image and Myria software

## Troubleshooting

If you encounter issues:

1. Check container logs: `docker logs myria-node`
2. Verify systemd is running: `docker exec myria-node systemctl status`
3. Check Myria service status: `docker exec myria-node systemctl status myria`
4. Ensure proper volume mounts and port mappings
