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

# Create startup script that installs Myria then starts systemd
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting Myria installation..."\n\
# Install Myria (works without systemd as PID 1)\n\
wget https://downloads-builds.myria.com/node/install.sh -O - | bash\n\
echo "Myria installation completed"\n\
echo "Starting systemd..."\n\
# Start systemd as PID 1 (same as original)\n\
exec /lib/systemd/systemd' > /startup.sh && \
    chmod +x /startup.sh

# Expose Myria default ports (adjust as needed)
EXPOSE 8333 8334 8335

VOLUME ["/sys/fs/cgroup", "/tmp", "/run"]
CMD ["/startup.sh"]
