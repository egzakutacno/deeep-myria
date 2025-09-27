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
# Third-party Base - Use our WORKING deep-myria approach
# ----------------------------------------
FROM eniocarboni/docker-ubuntu-systemd:focal AS myria-riptide-base

# Install Node.js 22+ (required by Riptide)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

# Install Myria node (same approach as your working omnia setup)
RUN apt-get update && apt-get install -y wget curl
RUN wget https://downloads-builds.myria.com/node/install.sh -O - | bash

WORKDIR /app

# ----------------------------------------
# Riptide Runtime Layer - Keep it simple
# ----------------------------------------
FROM myria-riptide-base AS riptide
COPY --from=quay.io/nerdnode/riptide:latest /usr/local/bin/riptide /usr/local/bin/riptide
COPY --from=quay.io/nerdnode/riptide:latest /riptide-runtime/ /riptide-runtime/
RUN chmod +x /usr/local/bin/riptide
ENV PATH="/usr/local/bin:$PATH"

# Create riptide user (Ubuntu style)
RUN groupadd -g 1005 riptide && useradd -u 1005 -g riptide -m -s /bin/bash riptide
RUN mkdir -p /riptide && chown -R riptide:riptide /riptide
COPY --from=builder --chown=riptide:riptide /app/dist /riptide/dist
COPY --from=builder --chown=riptide:riptide /app/node_modules /riptide/node_modules
COPY --from=builder --chown=riptide:riptide /app/package.json /riptide/package.json
COPY --chown=riptide:riptide riptide.config.json /riptide/riptide.config.json

EXPOSE 3000
WORKDIR /riptide
USER riptide
ENV NODE_ENV=production
ENTRYPOINT ["/usr/local/bin/riptide"]
CMD ["start", "--config", "/riptide/riptide.config.json", "--hooks", "/riptide/dist/hooks.js"]
