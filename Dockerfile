# Denla Discount Shop - Production Dockerfile
# Multi-stage build for optimized image size

FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy application files
WORKDIR /app
COPY backend ./backend
COPY public ./public
COPY api ./api

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app ./

# Set NODE_ENV
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application with dumb-init
CMD ["dumb-init", "node", "backend/server.js"]
