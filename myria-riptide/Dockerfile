# DeEEP Network Service for myria-riptide

# ----------------------------------------
# Builder Stage
# ----------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./

# Copy source code and config
COPY tsconfig.json ./
COPY tsup.config.ts ./
COPY src ./src

# Build the application
RUN npm install
RUN npm run build
RUN npm prune --omit=dev

# ----------------------------------------
# Third-party Base - Use EXACT working omnia approach
# ----------------------------------------
FROM eniocarboni/docker-ubuntu-systemd:focal AS myria-riptide-base

# Install Node.js 22+ (required by Riptide)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

# Install system dependencies (Myria will be installed at runtime)
RUN apt-get update && apt-get install -y wget curl

WORKDIR /app

# ----------------------------------------
# Riptide Runtime Layer - Keep it simple
# ----------------------------------------
FROM myria-riptide-base AS riptide
COPY --from=quay.io/nerdnode/riptide:latest /usr/local/bin/riptide /usr/local/bin/riptide
COPY --from=quay.io/nerdnode/riptide:latest /riptide-runtime/ /riptide-runtime/
RUN chmod +x /usr/local/bin/riptide
ENV PATH="/usr/local/bin:$PATH"

# Run as root (like our working containers)
RUN mkdir -p /riptide
COPY --from=builder /app/dist /riptide/dist
COPY --from=builder /app/node_modules /riptide/node_modules
COPY --from=builder /app/package.json /riptide/package.json
COPY riptide.config.json /riptide/riptide.config.json

# Create systemd service for Riptide
RUN echo '[Unit]\n\
Description=Riptide Myria Service\n\
After=multi-user.target\n\
\n\
[Service]\n\
Type=simple\n\
ExecStart=/usr/local/bin/riptide start --config /riptide/riptide.config.json --hooks /riptide/dist/hooks.js\n\
Restart=always\n\
RestartSec=5\n\
WorkingDirectory=/riptide\n\
Environment=NODE_ENV=production\n\
\n\
[Install]\n\
WantedBy=multi-user.target' > /etc/systemd/system/riptide-myria.service

# Enable the service
RUN systemctl enable riptide-myria.service

EXPOSE 3000
WORKDIR /riptide
ENV NODE_ENV=production
CMD ["/lib/systemd/systemd"]
