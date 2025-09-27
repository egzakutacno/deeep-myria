# Dockerfile for Myria with systemd support
# Based on docker-ubuntu-systemd pattern

FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV container=docker

# Install systemd and other essential packages
RUN apt-get update && apt-get install -y \
    systemd \
    systemd-sysv \
    curl \
    wget \
    gnupg \
    lsb-release \
    ca-certificates \
    software-properties-common \
    apt-transport-https \
    git \
    build-essential \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Remove unnecessary systemd targets and services
RUN (cd /lib/systemd/system/sysinit.target.wants/; for i in *; do [ $i == systemd-tmpfiles-setup.service ] || rm -f $i; done); \
    rm -f /lib/systemd/system/multi-user.target.wants/*; \
    rm -f /etc/systemd/system/*.wants/*; \
    rm -f /lib/systemd/system/local-fs.target.wants/*; \
    rm -f /lib/systemd/system/sockets.target.wants/*udev*; \
    rm -f /lib/systemd/system/sockets.target.wants/*initctl*; \
    rm -f /lib/systemd/system/basic.target.wants/*; \
    rm -f /lib/systemd/system/anaconda.target.wants/*

# Create myria user
RUN useradd -m -s /bin/bash myria && \
    usermod -aG sudo myria

# Create myria application directory
RUN mkdir -p /opt/myria && \
    chown myria:myria /opt/myria

# Install Myria dependencies and software
# Note: This is a placeholder - you'll need to add the actual Myria installation commands
# based on the specific requirements of the Myria software you're installing

# Copy any local installation scripts
COPY scripts/ /opt/myria/scripts/
RUN chmod +x /opt/myria/scripts/*.sh && \
    chown -R myria:myria /opt/myria

# Create systemd service files for Myria
COPY systemd/ /etc/systemd/system/
RUN systemctl enable myria.service

# Create myria data directory
RUN mkdir -p /var/lib/myria && \
    chown myria:myria /var/lib/myria

# Create myria log directory
RUN mkdir -p /var/log/myria && \
    chown myria:myria /var/log/myria

# Expose ports (adjust as needed for Myria)
EXPOSE 8080 9090

# Set the default command
CMD ["/lib/systemd/systemd"]
