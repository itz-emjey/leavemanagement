# ──────────────────────────────────────────────────────────
# Frontend Dockerfile — Leave Management System
# Multi-stage: build with Vite → serve with nginx
# ──────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Build the SPA
RUN npm run build

# ── Stage 2: nginx serve ──────────────────────────────────
FROM nginx:1.27-alpine AS production

# Default fallback to prevent crash if variable is missing
ENV BACKEND_URL=http://localhost:5000

# Fix BACKEND_URL to ensure it has http:// or https:// prefix (fixes invalid URL prefix crashes)
RUN echo '#!/bin/sh' > /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo 'if [ -z "$BACKEND_URL" ]; then' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo '  export BACKEND_URL="http://localhost:5000"' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo 'else' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo '  case "$BACKEND_URL" in' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo '    http://*|https://*) ;;' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo '    *) export BACKEND_URL="https://$BACKEND_URL" ;;' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo '  esac' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    echo 'fi' >> /docker-entrypoint.d/19-fix-backend-url.sh && \
    chmod +x /docker-entrypoint.d/19-fix-backend-url.sh

# Copy nginx configuration as a template (official nginx image will automatically envsubst it)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: remove default nginx content
RUN rm -rf /usr/share/nginx/html/index.html.nginx-default 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
