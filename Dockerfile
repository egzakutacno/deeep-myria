FROM ubuntu:22.04
LABEL maintainer="Enio Carboni"

ARG DEBIAN_FRONTEND=noninteractive

# Install: dependencies, clean: apt cache, remove dir: cache, man, doc, change mod time of cache dir.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       software-properties-common \
       rsyslog systemd systemd-cron sudo \
       wget curl ca-certificates \
    && apt-get clean \
    && rm -Rf /usr/share/doc && rm -Rf /usr/share/man \
    && rm -rf /var/lib/apt/lists/* \
    && touch -d "2 hours ago" /var/lib/apt/lists

# Configure rsyslog
RUN sed -i 's/^\($ModLoad imklog\)/#\1/' /etc/rsyslog.conf

# Remove unnecessary systemd services for container environment
RUN rm -f /lib/systemd/system/systemd*udev* \
  && rm -f /lib/systemd/system/getty.target

# Create a non-root user for Myria (optional, for security)
RUN useradd -m -s /bin/bash myria && \
    usermod -aG sudo myria && \
    echo "myria ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create systemd service that installs Myria on first boot
RUN echo '[Unit]\n\
Description=Install Myria on first boot\n\
After=multi-user.target\n\
\n\
[Service]\n\
Type=oneshot\n\
ExecStart=/bin/bash -c "if [ ! -f /usr/local/bin/myria-node ]; then echo \"Installing Myria...\"; wget https://downloads-builds.myria.com/node/install.sh -O - | bash; echo \"Myria installation completed\"; fi"\n\
RemainAfterExit=yes\n\
\n\
[Install]\n\
WantedBy=multi-user.target' > /etc/systemd/system/myria-installer.service

# Enable the installer service
RUN systemctl enable myria-installer.service || true

# Expose Myria default ports (adjust as needed)
EXPOSE 8333 8334 8335

VOLUME ["/sys/fs/cgroup", "/tmp", "/run"]
CMD ["/lib/systemd/systemd"]
