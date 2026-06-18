# ──────────────────────────────────────────────────────────
# Backend Dockerfile — Leave Management System
# Multi-stage: build → production
# ──────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Prune dev dependencies for smaller production image
RUN npm ci --production && npm cache clean --force

# ── Stage 2: Production ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R appuser:appgroup uploads

# Use non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["node", "dist/server.js"]
