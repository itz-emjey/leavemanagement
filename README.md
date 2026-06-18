# Leave Management System

> A production-ready, enterprise-grade school leave management system built with React 19 + TypeScript + Vite (frontend) and Node.js + Express + TypeScript + Sequelize + MySQL (backend).

[![CI Status](https://github.com/your-org/leavemanagement/workflows/CI/badge.svg)](.github/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-20.x-brightgreen)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Database Setup](#1-database-setup)
  - [Backend Setup](#2-backend-setup)
  - [Frontend Setup](#3-frontend-setup)
  - [Running with Docker](#4-running-with-docker-alternative)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
- [Default Accounts](#default-accounts)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd leavemanagement

# 2. Create a MySQL database named 'leave_management'

# 3. Set up the backend
cd backend
cp .env.example .env        # Edit .env with your database credentials
npm install
npm run migrate             # Creates database tables
npm run seed                # Seeds default data (roles, departments, admin user)
npm run dev                 # Starts backend on http://localhost:5000

# 4. In a new terminal, set up the frontend
cd frontend
npm install
npm run dev                 # Starts frontend on http://localhost:5173

# 5. Open http://localhost:5173 and login with:
#    Email: admin@company.com
#    Password: admin123
```

> **⚠️ Important:** You must set `JWT_SECRET` and (in production) `DB_PASSWORD` environment variables before running. Copy `.env.example` to `.env` and update the values.

---

## Features

### Employee Features
- **Apply for Leave** — Request leave with date range, type, reason, and file attachments
- **Half-day & Hourly Leave** — Flexible duration types for partial-day absences
- **Recurring Leave Patterns** — Set up weekly/biweekly/monthly repeating leave schedules
- **Dashboard** — Personal KPIs, leave balances, calendar view, and recent requests
- **Leave History** — View, filter, and track all leave requests
- **Profile Management** — Update personal details and upload profile picture
- **Team Calendar** — View team members' approved leaves (manager visibility)

### Admin Features
- **Employee Management** — CRUD, search, filter, pagination, bulk CSV/Excel import
- **Leave Credits** — Allocate, adjust, bulk adjust, and carry over leave balances
- **Leave Types** — Configure leave types with colors and default allocations
- **Departments** — Manage organizational structure
- **Holidays** — Set up company holidays (annual/recurring)
- **Leave Policies** — Configure max consecutive days, notice periods, carry-over limits
- **Approval Workflow** — Multi-level approval (manager → admin), department-scope enforcement
- **Reports & Analytics** — Trends, distribution, department comparison, PDF/CSV export
- **Audit Logs** — Full activity audit trail with search and CSV export
- **Permissions** — Role-based access control with granular resource/action permissions
- **System Config** — Application-wide configuration settings

### Technical Features
- **Real-time Notifications** — Socket.IO push notifications for leave events
- **Email Notifications** — Resend integration for password reset and leave status updates
- **Dark Mode** — Full dark mode support with persistent preference
- **PWA Support** — Progressive Web App with offline caching
- **Sentry Error Tracking** — Production error monitoring (configurable)
- **Security** — Helmet headers, rate limiting, CSRF protection, XSS sanitization, httpOnly JWT cookies
- **Monitoring** — Health check, metrics endpoint, structured logging, response time tracking
- **Docker Support** — Multi-stage Dockerfiles, docker-compose, CI/CD pipelines

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 5.5.x | Type safety |
| Vite | 6.x | Build tool & dev server |
| TailwindCSS | 3.4.x | Utility-first styling |
| React Router | 7.x | Client-side routing |
| TanStack Table | 8.x | Data tables |
| Recharts | 2.x | Charts & graphs |
| FullCalendar | 6.x | Calendar views |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |
| Axios | 1.x | HTTP client |
| Socket.IO Client | 4.x | Real-time communication |
| Lucide React | — | Icons |
| Sonner | — | Toast notifications |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Runtime |
| Express | 4.x | HTTP framework |
| TypeScript | 5.5.x | Type safety |
| Sequelize | 6.x | ORM |
| MySQL 2 | 3.x | Database driver |
| MySQL | 8.0 | Database |
| Zod | 4.x | Request validation |
| JWT | 9.x | Authentication |
| Socket.IO | 4.x | Real-time |
| Multer | 1.x | File uploads |
| Resend | — | Email service |
| PDFKit | — | PDF generation |
| Helmet | 8.x | Security headers |
| node-cron | — | Scheduled tasks |
| ioredis | — | Caching (optional) |
| Swagger UI Express | 5.x | API documentation |

---

## Project Structure

```
leavemanagement/
├── backend/                          # Node.js + Express API server
│   ├── src/
│   │   ├── config/                   # Configuration (database, constants, migrations)
│   │   ├── controllers/              # Route handler logic
│   │   ├── docs/                     # OpenAPI/Swagger documentation
│   │   ├── middleware/               # Auth, RBAC, validation, logging
│   │   ├── migrations/               # SQL migration files
│   │   ├── models/                   # Sequelize model definitions
│   │   ├── routes/                   # Express route definitions
│   │   ├── seeders/                  # Database seed script
│   │   ├── types/                    # Shared TypeScript types
│   │   ├── utils/                    # Utilities (JWT, email, logger, PDF, cron)
│   │   ├── __tests__/                # Jest test files
│   │   ├── app.ts                    # Express application setup
│   │   └── server.ts                 # Server entry point (Socket.IO, graceful shutdown)
│   ├── uploads/                      # File upload directory
│   ├── Dockerfile                    # Multi-stage production build
│   └── .env.example                  # Environment variable template
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── context/                  # React contexts (Auth, Socket)
│   │   ├── layouts/                  # Dashboard layout with sidebar
│   │   ├── lib/                      # Utilities (Axios instance, helpers)
│   │   ├── pages/                    # Page components
│   │   ├── types/                    # TypeScript type definitions
│   │   ├── __tests__/                # Vitest test files
│   │   ├── App.tsx                   # Application root with routing
│   │   ├── main.tsx                  # Entry point (Sentry init)
│   │   └── index.css                 # Global styles + Tailwind
│   ├── e2e/                          # Playwright E2E tests
│   ├── Dockerfile                    # Multi-stage nginx build
│   ├── nginx.conf                    # Production nginx config
│   └── .env.example                  # Environment variable template
│
├── docs/                             # Project documentation
│   ├── architecture.md               # Architecture overview
│   ├── deployment.md                 # Deployment guide
│   ├── admin-guide.md                # Admin user guide
│   └── employee-guide.md             # Employee user guide
│
├── .github/workflows/                # CI/CD pipelines
│   ├── ci.yml                        # Continuous integration
│   └── deploy.yml                    # Production deployment
│
├── docker-compose.yml                # Multi-service Docker Compose
├── V1.MD                             # Original specification (V1)
├── V2.MD                             # V2 enhancement plan
├── V3.MD                             # V3 professional upgrade status
└── package.json                      # Root package.json (workspace scripts)
```

---

## Prerequisites

- **Node.js** v20.x or later
- **npm** v10.x or later
- **MySQL** 8.0 or later
- **Git** (for version control)

Optional:
- **Docker** & **Docker Compose** (for containerized deployment)
- **Resend API key** (for email notifications)
- **Sentry DSN** (for error tracking)

---

## Setup Instructions

### 1. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE IF NOT EXISTS leave_management;
```

Or using the command line:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS leave_management;"
```

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# Minimum required: JWT_SECRET, DB_PASSWORD (in production)

# Install dependencies
npm install

# Run database migrations (creates all tables)
npm run migrate

# Seed default data (roles, departments, leave types, admin user)
npm run seed

# Start development server with hot-reload
npm run dev
```

The backend API will be available at **http://localhost:5000**.

> **Sequelize sync:** On first run, the server also syncs models to the database automatically as a fallback. The SQL migrations in `backend/src/migrations/` are the canonical source of truth.

### 3. Frontend Setup

```bash
cd frontend

# Copy environment variables (optional for development)
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend app will be available at **http://localhost:5173**.

> **Note:** In development mode, Vite proxies API requests to `http://localhost:5000`. No CORS issues!

### 4. Running with Docker (Alternative)

```bash
# From the project root
docker compose up -d

# This starts three services:
# - MySQL 8.0 (port 3307)
# - Backend API (port 5000)
# - Frontend SPA (port 80)
```

> **Note:** The first startup may take 1-2 minutes while the database initializes. Check logs with `docker compose logs -f`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `5000` | API server port |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `DB_HOST` | No | `localhost` | Database host |
| `DB_PORT` | No | `3306` | Database port |
| `DB_NAME` | No | `leave_management` | Database name |
| `DB_USER` | No | `root` | Database user |
| `DB_PASSWORD` | Production | — | Database password |
| `JWT_SECRET` | **Yes** | — | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiration duration |
| `RESEND_API_KEY` | No | — | Resend email API key |
| `EMAIL_FROM` | No | `noreply@leavemanagement.com` | Email sender address |
| `REDIS_URL` | No | — | Redis connection string (optional) |
| `SENTRY_DSN` | No | — | Sentry error tracking DSN |
| `COOKIE_SECRET` | No | Falls back to JWT_SECRET | Cookie signing secret |

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `/api` | API base URL |
| `VITE_SENTRY_DSN` | No | — | Sentry error tracking DSN |

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm test` | Run Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run migrate` | Run SQL migrations |
| `npm run seed` | Seed database with default data |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |

---

## API Documentation

Interactive API documentation is available via Swagger UI when the backend is running:

- **Swagger UI:** http://localhost:5000/api/docs

The API is organized into the following resource groups:

| Group | Base Path | Auth Required |
|---|---|---|
| Authentication | `/api/auth` | Mixed |
| Dashboard | `/api/dashboard` | Yes |
| Employees | `/api/employees` | Yes (admin/manager) |
| Leave Requests | `/api/leave-requests` | Yes |
| Leave Credits | `/api/leave-credits` | Yes (admin) |
| Leave Types | `/api/leave-types` | Yes |
| Leave Policies | `/api/leave-policies` | Yes |
| Leave Patterns | `/api/leave-patterns` | Yes |
| Departments | `/api/departments` | Yes |
| Holidays | `/api/holidays` | Yes |
| Notifications | `/api/notifications` | Yes |
| Reports | `/api/reports` | Yes |
| Audit Logs | `/api/audit-logs` | Yes (admin) |
| Analytics | `/api/analytics` | Yes (admin) |
| Permissions | `/api/permissions` | Yes (admin) |
| System Config | `/api/system-config` | Yes (admin) |
| Calendar | `/api/calendar` | Public (with token) |
| Monitoring | `/api/health`, `/api/metrics` | Public |

---

## Default Accounts

After running `npm run seed`, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@company.com` | `admin123` |
| Manager | *Create via UI* | — |
| Employee | *Create via UI* | — |

> **⚠️ Security:** Change the admin password immediately after first login in production!

Seeded data also includes:
- **3 roles:** admin, manager, employee
- **5 departments:** Engineering, HR, Finance, Marketing, Operations
- **5 leave types:** Annual (12 days), Sick (14), Personal (5), Maternity (90), Paternity (7)
- **Granular permissions** for each role

---

## Documentation

For detailed documentation, see the `docs/` directory:

| Document | Description |
|---|---|
| [Architecture Overview](docs/architecture.md) | System architecture, data model, design decisions |
| [Deployment Guide](docs/deployment.md) | Production deployment instructions |
| [Admin User Guide](docs/admin-guide.md) | Guide for system administrators |
| [Employee User Guide](docs/employee-guide.md) | Guide for regular employees |

---

## Troubleshooting

### Database Connection Issues

```bash
# Verify MySQL is running
mysqladmin ping -h localhost

# Check credentials
mysql -u root -p -e "SELECT 1"
```

### Port Already in Use

```bash
# Backend (port 5000)
npx kill-port 5000

# Frontend (port 5173)
npx kill-port 5173
```

### Reset Everything

```bash
# Drop and recreate database
cd backend
npm run migrate    # Creates tables
npm run seed       # Seeds default data
```

### Common Issues

| Issue | Solution |
|---|---|
| `Missing required environment variable: JWT_SECRET` | Copy `.env.example` to `.env` and set `JWT_SECRET` |
| `ECONNREFUSED` on database | Ensure MySQL is running and credentials are correct |
| `CORS policy` errors | Check `FRONTEND_URL` in backend `.env` matches your frontend URL |
| File upload fails | Check `uploads/` directory exists and is writable |
| Email not sending | Set `RESEND_API_KEY` in backend `.env` |

---

## License

This project is licensed under the MIT License.
