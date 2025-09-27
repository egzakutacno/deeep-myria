# Use Ubuntu with systemd as PID 1
FROM eniocarboni/docker-ubuntu-systemd:latest

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV container=docker

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    systemd \
    systemd-sysv \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22+ (required by Riptide SDK)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Create application directories
RUN mkdir -p /root/src /root/logs

# Install Myria node
RUN wget -qO- https://downloads-builds.myria.com/node/install.sh | bash

# Set working directory
WORKDIR /root

# Copy package files first for better Docker layer caching
COPY package.json ./
COPY package-lock.json* ./

# Install Riptide SDK and dependencies
RUN npm install @deeep-network/riptide

# Copy application files
COPY src/hooks.js ./src/
COPY manager.js ./
COPY run-riptide.sh ./
COPY riptide.config.json ./

# Make scripts executable
RUN chmod +x run-riptide.sh

# Create symlink for hooks.js
RUN ln -sf /root/src/hooks.js /root/hooks.js

# Copy systemd service files
COPY myria.service /etc/systemd/system/
COPY myria-riptide-manager.service /etc/systemd/system/

# Enable services
RUN systemctl enable myria.service
RUN systemctl enable myria-riptide-manager.service

# Create logs directory with proper permissions
RUN mkdir -p /var/log/myria && chown root:root /var/log/myria

# Expose ports (adjust as needed for Myria and Riptide)
EXPOSE 3000 8080

# Set systemd as entrypoint
ENTRYPOINT ["/lib/systemd/systemd"]
