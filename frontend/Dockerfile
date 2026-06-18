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
