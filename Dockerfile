FROM eniocarboni/docker-ubuntu-systemd:focal

# Install Myria during build (same as your working setup)
RUN apt-get update && apt-get install -y wget curl
RUN wget https://downloads-builds.myria.com/node/install.sh -O - | bash

# Expose Myria default ports (adjust as needed)
EXPOSE 8333 8334 8335

VOLUME ["/sys/fs/cgroup", "/tmp", "/run"]
CMD ["/lib/systemd/systemd"]
