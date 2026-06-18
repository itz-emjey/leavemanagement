# Deployment Guide

> **Document:** Deployment Guide
> **Project:** Leave Management System
> **Version:** 1.0.0
> **Last Updated:** June 18, 2026

---

## Table of Contents

1. [Deployment Options](#1-deployment-options)
2. [Docker Deployment (Recommended)](#2-docker-deployment-recommended)
3. [Manual Deployment](#3-manual-deployment)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Setup](#5-database-setup)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [SSL/TLS Setup](#7-ssltls-setup)
8. [Monitoring & Maintenance](#8-monitoring--maintenance)
9. [Backup & Recovery](#9-backup--recovery)
10. [Scaling Considerations](#10-scaling-considerations)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Deployment Options

| Method | Difficulty | Use Case |
|---|---|---|
| **Docker Compose** (recommended) | Easy | Single-server production, development, staging |
| **Manual (npm + systemd)** | Medium | Bare-metal servers, custom infrastructure |
| **Kubernetes** | Advanced | Multi-server, auto-scaling, high-availability |

---

## 2. Docker Deployment (Recommended)

### Prerequisites

- Docker 24+ and Docker Compose v2+
- Git
- A server with at least **2GB RAM** and **20GB disk**

### Step 1: Clone the Repository

```bash
git clone <repo-url> /opt/leavemanagement
cd /opt/leavemanagement
```

### Step 2: Configure Environment

```bash
# Copy and edit the docker-compose environment
# Create a .env file with production values:
cat > .env << 'EOF'
# ── Database ──────────────────────────────────────────────
DB_ROOT_PASSWORD=your-strong-root-password-here
DB_NAME=leave_management
DB_USER=leavems
DB_PASSWORD=your-strong-db-password-here
DB_PORT=3307

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=your-64-char-hex-secret-here
JWT_EXPIRES_IN=7d

# ── Application ───────────────────────────────────────────
NODE_ENV=production
FRONTEND_URL=http://your-domain.com
BACKEND_PORT=5000
FRONTEND_PORT=80

# ── Email (Optional) ──────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@your-domain.com

# ── Sentry (Optional) ─────────────────────────────────────
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxx.ingest.sentry.io/xxxxxx

# ── Redis (Optional) ──────────────────────────────────────
# REDIS_URL=redis://redis:6379
EOF
```

> Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Step 3: Start Services

```bash
# Start all services in detached mode
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check health
curl http://localhost:5000/api/health
```

### Step 4: Run Database Migrations & Seed

```bash
# Run migrations (creates all tables)
docker compose exec backend npx ts-node src/config/migrate.ts

# Seed default data
docker compose exec backend npx ts-node src/seeders/seed.ts
```

### Step 5: Verify Deployment

```bash
# Health check
curl http://localhost:5000/api/health

# API docs
curl http://localhost:5000/api/docs

# Frontend
curl http://localhost
```

### Docker Compose Services

| Service | Image | Port | Health Check |
|---|---|---|---|
| `mysql` | mysql:8.0 | 3307 | mysqladmin ping |
| `backend` | Built from `backend/Dockerfile` | 5000 | GET /api/health |
| `frontend` | Built from `frontend/Dockerfile` | 80 | nginx health |

### Production Dockerfile Details

**Backend:**
- Multi-stage build: builder (npm ci + tsc) → production (node:20-alpine)
- Non-root user (`appuser`)
- HEALTHCHECK instruction
- Uploads volume mounted for persistence

**Frontend:**
- Multi-stage build: Vite build → nginx:1.27-alpine
- Custom nginx config with SPA routing, API proxying, WebSocket support
- Static asset caching (1 year for hashed files)
- Security headers

---

## 3. Manual Deployment

### Prerequisites

- Node.js 20.x
- MySQL 8.0
- nginx (or similar reverse proxy)
- PM2 or systemd for process management

### Step 1: Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leave_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'leavems'@'localhost' IDENTIFIED BY 'your-password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON leave_management.* TO 'leavems'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

### Step 2: Backend Deploy

```bash
cd /opt/leavemanagement/backend

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Configure environment
cp .env.example .env
# Edit .env with production values

# Run migrations
npm run migrate

# Seed data (first time only)
npm run seed

# Start with PM2
npm install -g pm2
pm2 start dist/server.js --name leavems-backend
pm2 save
pm2 startup
```

### Step 3: Frontend Deploy

```bash
cd /opt/leavemanagement/frontend

# Install dependencies
npm ci

# Build for production
npm run build

# The built files are in dist/
# Serve via nginx (see nginx.conf in the repository)
sudo cp -r dist/* /var/www/leavemanagement/
```

### Step 4: nginx Configuration

```nginx
# /etc/nginx/sites-available/leavemanagement
server {
    listen 80;
    server_name your-domain.com;

    # Frontend SPA
    root /var/www/leavemanagement;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Requested-With XMLHttpRequest;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        expires 7d;
    }
}
```

### Step 5: Enable and Start

```bash
sudo ln -s /etc/nginx/sites-available/leavemanagement /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. Environment Configuration

### Required Variables (Production)

| Variable | Where | Why Required |
|---|---|---|
| `JWT_SECRET` | Backend .env | Token signing (min 64 chars hex) |
| `DB_PASSWORD` | Backend .env | Database authentication |
| `NODE_ENV=production` | Backend .env | Enables production optimizations |

### Recommended for Production

- **Set `SENTRY_DSN`** for error tracking
- **Set `RESEND_API_KEY`** for email notifications
- **Generate strong passwords** for database and JWT
- **Use `REDIS_URL`** if deploying multiple backend instances

---

## 5. Database Setup

### Production Database Best Practices

1. **Use a dedicated MySQL user** — Not `root`
2. **Strong password** — At least 16 characters with mixed case and symbols
3. **Separate database server** — For high-availability deployments
4. **Regular backups** — Automated daily backups (see Backup section)
5. **Connection pooling** — Configured in Sequelize (max 10 connections)

### Migration Commands

```bash
# Apply all pending migrations
cd backend && npm run migrate

# Check migration status
cd backend && npm run migration:status

# Seed initial data (first deployment only)
cd backend && npm run seed
```

---

## 6. CI/CD Pipeline

### GitHub Actions Workflows

The project includes two GitHub Actions workflows:

### CI Pipeline (`.github/workflows/ci.yml`)

Triggers on: **push** (main, develop), **PR** (main)

**Backend Jobs:**
- TypeScript type checking
- ESLint linting
- Jest unit tests (with MySQL service container)

**Frontend Jobs:**
- TypeScript type checking
- Vite production build
- Vitest unit tests
- Coverage report upload

### Deploy Pipeline (`.github/workflows/deploy.yml`)

Triggers on: **push** (main) or **manual dispatch**

**Stages:**
1. **Build & Push Docker Images** — Builds backend and frontend images, pushes to GitHub Container Registry (ghcr.io)
2. **Deploy to Production** — SSH into production server, pulls images, restarts containers

### Setting Up CI/CD

1. **Fork/clone** the repository to GitHub
2. **Add repository secrets:**

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | Production server IP/hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |
| `DEPLOY_PORT` | SSH port (default 22) |

3. **Push to `main`** to trigger deployment

---

## 7. SSL/TLS Setup

### Option 1: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (usually configured automatically)
sudo certbot renew --dry-run
```

### Option 2: Cloudflare (Recommended for Schools)

1. Add domain to Cloudflare
2. Set SSL/TLS to "Full (strict)"
3. Configure nginx to listen on 443 with Cloudflare Origin Certificate

### Option 3: Reverse Proxy with Caddy (Simplest)

Replace nginx with Caddy for automatic HTTPS:

```caddyfile
# Caddyfile
your-domain.com {
    # Frontend
    root * /var/www/leavemanagement
    try_files {path} /index.html

    # API proxy
    reverse_proxy /api/* localhost:5000
    reverse_proxy /socket.io/* localhost:5000
    reverse_proxy /uploads/* localhost:5000

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

---

## 8. Monitoring & Maintenance

### Built-in Monitoring

The application provides two monitoring endpoints:

| Endpoint | Description | Example |
|---|---|---|
| `GET /api/health` | Health check (uptime, DB, memory) | `{ "status": "ok", "uptime": {...}, "database": "connected" }` |
| `GET /api/metrics` | Application metrics | `{ "requests": {...}, "memory": {...}, "cpu": {...} }` |

### Logging

- **Structured JSON logs** — All logs are structured with timestamp, level, requestId
- **Request logging** — Every request is logged with method, URL, status, duration
- **Slow request alerts** — Warnings logged for responses >500ms
- **SQL query logging** — Dev only; logs all queries with timing

### Sentry Error Tracking (Optional)

Configure `SENTRY_DSN` in your `.env` to enable error tracking. Sentry captures:
- Unhandled exceptions
- Slow transactions
- Performance traces
- Frontend errors + session replays

### Regular Maintenance Tasks

| Task | Frequency | Command |
|---|---|---|
| Check logs | Daily | `docker compose logs --tail=50` |
| Database backup | Daily | See Backup section |
| SSL renewal | Monthly (auto) | `certbot renew` |
| OS updates | Monthly | `apt update && apt upgrade` |
| Docker cleanup | Monthly | `docker system prune -f` |
| Review Sentry issues | Weekly | Check Sentry dashboard |

---

## 9. Backup & Recovery

### Database Backup

```bash
# Manual backup
docker compose exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} leave_management > backup_$(date +%Y%m%d).sql

# Automated backup script (add to cron)
cat > /etc/cron.daily/leavems-backup << 'EOF'
#!/bin/bash
BACKUP_DIR=/opt/backups/leavemanagement
mkdir -p $BACKUP_DIR
docker compose -f /opt/leavemanagement/docker-compose.yml exec -T mysql \
  mysqldump -u root -p${DB_ROOT_PASSWORD} leave_management \
  | gzip > $BACKUP_DIR/leavems_$(date +%Y%m%d_%H%M%S).sql.gz
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/leavems-backup
```

### Uploads Backup

```bash
# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /opt/leavemanagement/uploads/
```

### Recovery

```bash
# Restore database
gunzip < backup.sql.gz | docker compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} leave_management

# Restore uploads
tar -xzf uploads_backup.tar.gz -C /opt/leavemanagement/
```

---

## 10. Scaling Considerations

### Vertical Scaling (Single Server)

- **CPU:** The application is not CPU-intensive; 2-4 cores is sufficient
- **Memory:** 2GB minimum, 4GB recommended for production
- **Disk:** SSD recommended; size depends on file upload volume

### Horizontal Scaling (Multi-Server)

To scale the backend across multiple servers:

1. **Shared Session Store** — Configure Redis for Socket.IO adapters
2. **Database Replication** — MySQL read replicas for reporting queries
3. **File Storage** — Migrate from local storage to S3-compatible object storage
4. **Load Balancer** — Add nginx or HAProxy in front of backend instances

### Performance Optimizations

- **Compression:** gzip/brotli compression enabled (min 256 bytes)
- **Caching:** Redis for API response caching (requires REDIS_URL)
- **PWA:** Service worker caches API responses (24h) and uploads (30d)
- **Database Indexes:** Composite indexes for common query patterns
- **Connection Pooling:** Sequelize pool with max 10 connections

---

## 11. Troubleshooting

### Common Deployment Issues

#### Database won't connect

```bash
# Check if MySQL is running
docker compose ps mysql

# View MySQL logs
docker compose logs mysql

# Test connection
docker compose exec mysql mysqladmin ping -h localhost

# Check credentials
docker compose exec mysql mysql -u leavems -p -e "SELECT 1;"
```

#### Backend crashes on startup

```bash
# Check logs
docker compose logs backend

# Common causes:
# - Missing JWT_SECRET environment variable
# - Database not ready yet (depends_on doesn't wait for readiness)
# - Port already in use

# Force restart
docker compose restart backend
```

#### Frontend shows blank page

```bash
# Check nginx logs
docker compose logs frontend

# Verify API proxy works
curl http://localhost/api/health

# Check browser console for errors
# Common cause: wrong FRONTEND_URL in backend env
```

#### File upload fails

```bash
# Check uploads directory permissions
docker compose exec backend ls -la /app/uploads

# Check disk space
df -h

# Common causes:
# - uploads directory not writable
# - Disk full
# - File exceeds 5MB limit
```

#### Email not sending

```bash
# Check if Resend API key is set
docker compose exec backend env | grep RESEND

# Check logs for email errors
docker compose logs backend | grep -i email

# Verify Resend API key is valid
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxx" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@your-domain.com","to":"test@example.com","subject":"Test","html":"<p>test</p>"}'
```

#### Port conflicts

```bash
# Check if ports are in use
netstat -tlnp | grep -E ':(80|5000|3307)'

# Change ports in docker-compose.yml or .env
# Backend: BACKEND_PORT=5001
# Frontend: FRONTEND_PORT=8080
# Database: DB_PORT=3308
```

---

*For architecture details, see the [Architecture Overview](architecture.md).*
*For user guides, see [Admin Guide](admin-guide.md) and [Employee Guide](employee-guide.md).*
