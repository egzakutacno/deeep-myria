# Use the systemd-enabled Ubuntu base image
FROM eniocarboni/docker-ubuntu-systemd:jammy

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=22
ENV RIPTIDE_SERVICE_NAME=riptide
ENV CRYPTO_NODE_SERVICE=myria-node
ENV INTERACTIVE_SETUP=false

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    software-properties-common \
    build-essential \
    python3 \
    python3-pip \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs

# Create application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Install Myria node software
RUN wget https://downloads-builds.myria.com/node/install.sh -O /tmp/install.sh \
    && chmod +x /tmp/install.sh \
    && /tmp/install.sh \
    && rm /tmp/install.sh

# Copy application files
COPY . .

# Create systemd service directory
RUN mkdir -p /etc/systemd/system

# Copy Riptide systemd service file
COPY riptide.service /etc/systemd/system/

# Create logs directory
RUN mkdir -p /var/log/riptide

# Create scripts directory and copy scripts
RUN mkdir -p /app/scripts
COPY scripts/ /app/scripts/

# Set proper permissions
RUN chmod +x /app/scripts/*.sh \
    && chown -R root:root /app \
    && chmod 755 /app

# Create Myria node directories
RUN mkdir -p /var/lib/myria-node \
    && mkdir -p /var/log/myria-node \
    && mkdir -p /etc/myria-node

# Set proper permissions for Myria node directories
RUN chown -R root:root /var/lib/myria-node \
    && chown -R root:root /var/log/myria-node \
    && chown -R root:root /etc/myria-node

# Enable the Riptide service
RUN systemctl enable riptide.service

# Expose ports (adjust as needed for your crypto node)
EXPOSE 3000 8080 8545 30303

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD systemctl is-active --quiet riptide.service || exit 1

# Use systemd as PID 1
ENTRYPOINT ["/lib/systemd/systemd"]
