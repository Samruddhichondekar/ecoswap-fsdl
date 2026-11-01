# ==========================================
# EcoSwap Backend Cloud Container
# Cloud Computing Lab (CCL) - Task 9: Containerisation
# ==========================================

# Production-grade slim Node.js base image
FROM node:20-alpine AS base

# Install dumb-init or dependencies if needed for signal handling
RUN apk add --no-cache dumb-init

# Set application working directory
WORKDIR /usr/src/app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5050

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies for minimal image footprint
RUN npm install --omit=dev --ignore-scripts

# Copy application source code
COPY . .

# Run as a non-privileged user for enhanced cloud container security
USER node

# Expose the application listening port
EXPOSE 5050

# Health check probe inside the container
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5050/api/health || exit 1

# Start container using dumb-init for clean process reaping
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]

