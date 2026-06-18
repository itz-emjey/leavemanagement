# Architecture Overview

> **Document:** Architecture Overview
> **Project:** Leave Management System
> **Version:** 1.0.0
> **Last Updated:** June 18, 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Tech Stack Rationale](#3-tech-stack-rationale)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema](#6-database-schema)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Real-time Communication](#8-real-time-communication)
9. [Email System](#9-email-system)
10. [Security Architecture](#10-security-architecture)
11. [Data Flow Examples](#11-data-flow-examples)
12. [Design Decisions](#12-design-decisions)

---

## 1. System Overview

The Leave Management System is a full-stack web application that enables organizations to manage employee leave requests, approvals, balances, and reporting. It follows a **client-server architecture** with a SPA (Single Page Application) frontend and a RESTful API backend.

### High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │◄───►│   nginx      │◄───►│   Express    │
│  (React SPA) │     │  (Proxy)     │     │   Backend    │
└──────────────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       │  (Optional PWA)                ┌───────┴───────┐
       │                                │   MySQL 8.0   │
       │                                │   Database    │
       │                                └───────────────┘
       │                                         │
       │                                ┌───────┴───────┐
       │                                │   Redis        │
       │                                │  (Optional)    │
       │                                └───────────────┘
```

### Key Architectural Principles

- **RESTful API** — Clean separation between frontend and backend
- **Stateless Authentication** — JWT-based auth with httpOnly cookies
- **Role-Based Access Control** — Granular permissions per resource/action
- **Event-Driven Notifications** — Socket.IO for real-time push
- **Layered Middleware** — Security, validation, logging, caching layers
- **Database-First Migrations** — SQL migration files as source of truth

---

## 2. Architecture Diagram

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React SPA)                      │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐   │
│  │  Pages   │  │Components│  │  Context  │  │   Utils/Lib   │   │
│  │          │  │          │  │           │  │               │   │
│  │ Dashboard│  │DataTable │  │AuthContext│  │Axios Instance │   │
│  │ Employees│  │KpiCards  │  │SocketCtx  │  │Date Helpers   │   │
│  │ Leaves   │  │Modals    │  │           │  │Formatters     │   │
│  │ Reports  │  │Skeletons│  │           │  │               │   │
│  │ Settings │  │Charts    │  │           │  │               │   │
│  └──────────┘  └──────────┘  └───────────┘  └───────────────┘   │
│         │            │              │                │            │
│         └────────────┴──────────────┴────────────────┘            │
│                              │                                    │
│                     ┌────────┴────────┐                           │
│                     │  React Router   │                           │
│                     │  (Client-side)  │                           │
│                     └────────┬────────┘                           │
└──────────────────────────────┼────────────────────────────────────┘
                               │ HTTP/HTTPS
                               │ JSON + WebSocket
┌──────────────────────────────┼────────────────────────────────────┐
│                   BACKEND (Express API)                            │
│                     ┌────────┴────────┐                           │
│                     │  nginx Proxy    │                           │
│                     └────────┬────────┘                           │
│                              │                                    │
│                     ┌────────┴────────┐                           │
│                     │    Express App   │                           │
│                     └────────┬────────┘                           │
│                              │                                    │
│              ┌───────────────┼───────────────┐                    │
│              │               │               │                    │
│      ┌───────┴──────┐ ┌─────┴─────┐ ┌───────┴──────┐             │
│      │  Middleware   │ │  Routes   │ │  Socket.IO   │             │
│      │              │ │           │ │   Server     │             │
│      │ • Auth (JWT) │ │ • Auth    │ │             │             │
│      │ • RBAC       │ │ • Leave   │ │ • Real-time  │             │
│      │ • Validation │ │ • Employee│ │ • Room-based │             │
│      │ • Logging    │ │ • Reports │ │ • Events     │             │
│      │ • Rate Limit │ │ • Admin   │ │             │             │
│      │ • CSRF       │ │ • Config  │ │             │             │
│      └───────┬──────┘ └─────┬─────┘ └─────────────┘             │
│              │              │                                     │
│              └──────────────┴──────────────────┐                  │
│                                                │                  │
│                                     ┌──────────┴──────────┐       │
│                                     │   Sequelize ORM     │       │
│                                     │  (MySQL Dialect)    │       │
│                                     └──────────┬──────────┘       │
│                                                │                  │
│                                     ┌──────────┴──────────┐       │
│                                     │     MySQL 8.0 DB    │       │
│                                     └─────────────────────┘       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack Rationale

### Why React 19 + TypeScript + Vite?

- **React 19** — Latest stable with improved server components and hooks
- **TypeScript** — Type safety reduces runtime errors, improves developer experience
- **Vite** — Fast HMR, native ESM, optimized builds vs Create React App
- **TailwindCSS** — Utility-first CSS for rapid UI development without context-switching

### Why Express + Sequelize + MySQL?

- **Express** — Mature, lightweight, unopinionated framework with extensive middleware ecosystem
- **Sequelize** — Most mature Node.js ORM with MySQL support, migrations, and eager loading
- **MySQL 8.0** — Relational integrity, fulltext search indexes, CTEs for analytics queries

### Why not alternatives?

| Alternative | Why Not Chosen |
|---|---|
| Next.js/Nuxt | SPA fits this use case better than SSR; simpler deployment |
| Prisma | Sequelize was already established; Prisma's migration support was less mature at project start |
| PostgreSQL | MySQL is more commonly available in educational institution hosting environments |
| MongoDB | Strong relational requirements (employees ↔ departments, leave approvals) make SQL a better fit |

---

## 4. Frontend Architecture

### Routing Structure

The app uses React Router v7 with nested route layouts:

```
<BrowserRouter>
  <AuthProvider>
    <ErrorBoundary>
      <Routes>
        <!-- Guest (unauthenticated) routes -->
        <GuestRoute>
          /login
          /forgot-password
          /reset-password
        </GuestRoute>

        <!-- Protected routes with DashboardLayout -->
        <ProtectedRoute>
          <DashboardLayout>           ← Sidebar + Header + <Outlet>
            /dashboard
            /profile
            /apply-leave
            /leave-requests
            /reports
            /employee-statement
            /team-calendar
            /leave-patterns
            /analytics

            <!-- Admin-only routes -->
            <AdminRoute>
              /employees
              /leave-credits
              /leave-types
              /departments
              /holidays
              /audit-logs
              /leave-policies
              /permissions
              /admin/system-config
            </AdminRoute>
          </DashboardLayout>
        </ProtectedRoute>

        /* → Redirect to /dashboard
      </Routes>
    </ErrorBoundary>
  </AuthProvider>
</BrowserRouter>
```

### State Management

The application uses **React Context** for global state rather than a heavier solution like Redux:

| Context | Purpose |
|---|---|
| `AuthContext` | Current user, token, login/logout, role checks |
| `SocketContext` | Real-time Socket.IO connection, toast notifications |

Page-level state is managed locally with `useState` and `useCallback`. Server data is fetched on-demand and cached by the PWA service worker.

### Component Library

Custom components built with TailwindCSS:

- **DataTablePagination** — Reusable paginated table with search (used in Employees, LeaveRequests, etc.)
- **KpiCards** — KPI metric cards with icons and trend indicators
- **Charts** — Wrappers around Recharts (area charts, pie charts, bar charts)
- **Skeleton** — Loading skeleton components for data-fetching states
- **NotificationToast** — Live toast notifications for real-time events
- **PageTransition** — Route transition animations using CSS
- **ErrorBoundary** — Catches and displays React rendering errors

---

## 5. Backend Architecture

### Application Layers

```
Request Flow:
───────────────

Client Request
      │
      ▼
┌─────────────────────┐
│ 1. Middleware Chain  │
│                     │
│ • Sentry (if DSN)   │
│ • Structured Logger │
│ • Compression       │
│ • Response Time     │
│ • Helmet (Security) │
│ • CORS              │
│ • Cookie Parser     │
│ • Body Parsing      │
│ • Request Size      │
│ • XSS Sanitization  │
│ • CSRF Protection   │
│ • Request Counting  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Route Matching    │
│                     │
│ /api/auth/login     │
│ /api/employees      │
│ /api/leave-requests │
│ ...                 │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Route Middleware  │
│                     │
│ • protect (JWT)     │
│ • authorize (Role)  │
│ • validate (Zod)    │
│ • upload (Multer)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Controller        │
│                     │
│ • Business logic    │
│ • DB queries (ORMs) │
│ • Audit logging     │
│ • Notifications     │
│ • Email sending     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Response          │
│                     │
│ • JSON response     │
│ • Error handling    │
│ • Sentry (on error) │
└─────────────────────┘
```

### Middleware Order

Middleware execution order is critical. The current order in `app.ts` ensures:

1. **Sentry** — Initializes before all middleware to capture early errors
2. **Structured Logger** — Logs every request with a unique requestId
3. **Compression** — Compresses responses (gzip/brotli)
4. **Response Time** — Tracks and logs slow responses (>500ms)
5. **Helmet** — Security headers
6. **CORS** — Cross-origin resource sharing
7. **Cookie Parser** — Parse cookies for JWT
8. **Body Parsing** — JSON and URL-encoded with 1MB limit
9. **Request Size** — 5MB limit for multipart
10. **XSS Sanitization** — Sanitize request body and query
11. **CSRF** — State-changing methods require X-Requested-With header
12. **Request Counting** — Track metrics (total, active, by route)

### Route Module Organization

Each resource group has its own route file that:
1. Creates an Express `Router`
2. Applies common middleware (e.g., `router.use(protect)`)
3. Defines routes with handler functions
4. Exports the router

Routes are registered in `app.ts` under the `/api` prefix:

```typescript
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
// ...etc
```

### Error Handling

Errors are handled through a centralized `errorHandler` middleware:

- **AppError class** — Custom error with status code, message, and optional error code
- **Zod validation errors** — Automatically formatted into field-level error messages
- **Sentry integration** — Captures unhandled errors when configured
- **Sequelize errors** — Unique constraint violations, foreign key errors formatted for clients

---

## 6. Database Schema

### Entity Relationship Diagram

```
┌───────────┐     ┌───────────┐     ┌──────────────┐
│   Roles   │1──N│   Users   │1──1│  Employees   │
└───────────┘     └───────────┘     └──────┬───────┘
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                              ▼            ▼            ▼
                    ┌──────────────┐ ┌──────────┐ ┌──────────┐
                    │LeaveBalances │ │LeaveReqs │ │LeavePatts│
                    └──────────────┘ └─────┬─────┘ └──────────┘
                                           │
                                    ┌──────┴──────┐
                                    │LvReqApprovals│
                                    └─────────────┘
┌───────────┐     ┌───────────┐
│LeaveTypes │1──N│LeavePolicies│
└───────────┘     └───────────┘

┌───────────┐     ┌──────────────┐
│Employees  │N──1│ Departments   │
└───────────┘     └──────────────┘

┌───────────┐     ┌──────────────┐
│   Users   │1──N│Notifications  │
└───────────┘     └──────────────┘

┌───────────┐     ┌──────────────┐
│   Users   │1──N│  AuditLogs   │
└───────────┘     └──────────────┘

┌───────────┐     ┌──────────────┐
│   Roles   │1──N│  Permissions │
└───────────┘     └──────────────┘
```

### Tables

| Table | Description | Key Fields |
|---|---|---|
| `roles` | User roles (admin, manager, employee) | `id`, `name`, `description` |
| `users` | Authentication accounts | `id`, `email`, `password`, `roleId` |
| `departments` | Organizational units | `id`, `name`, `description` |
| `employees` | Employee profiles | `id`, `userId`, `employeeId`, `firstName`, `lastName`, `departmentId`, `managerId` |
| `leave_types` | Leave categories | `id`, `name`, `defaultDays`, `color` |
| `leave_balances` | Per-employee leave allocations | `id`, `employeeId`, `leaveTypeId`, `allocated`, `used`, `remaining`, `year` |
| `leave_requests` | Leave applications | `id`, `employeeId`, `leaveTypeId`, `startDate`, `endDate`, `duration`, `status` |
| `leave_request_approvals` | Multi-level approval steps | `id`, `leaveRequestId`, `approverId`, `level`, `status` |
| `leave_patterns` | Recurring leave schedules | `id`, `employeeId`, `leaveTypeId`, `frequency`, `dayOfWeek` |
| `leave_policies` | Leave type policies | `id`, `leaveTypeId`, `maxConsecutiveDays`, `carryOverLimit` |
| `holidays` | Company holidays | `id`, `name`, `date`, `isRecurring` |
| `notifications` | In-app notifications | `id`, `userId`, `title`, `message`, `type`, `isRead` |
| `audit_logs` | Activity audit trail | `id`, `userId`, `action`, `entity`, `entityId`, `details` |
| `permissions` | Granular RBAC permissions | `id`, `roleId`, `resource`, `action`, `allowed` |
| `system_configs` | Application configuration | `id`, `key`, `value`, `type`, `group` |

### Indexing Strategy

- **Composite indexes** on `leave_requests` for common query patterns (employee + status + dates)
- **Fulltext indexes** on `employees` (firstName, lastName, email) and `departments` (name) for search
- **Unique constraints** on employeeId, email, leave_balances per employee/type/year
- **Foreign key indexes** on all relationship columns

### Migration Strategy

Migrations are SQL files executed in order by a custom migration runner:

1. `001_initial_schema.sql` — All table definitions
2. `002_composite_indexes.sql` — Performance indexes and fulltext search indexes

The Sequelize `sync({ alter: true })` method is no longer used; migrations are the canonical schema source.

---

## 7. Authentication & Authorization

### Authentication Flow

```
1. User submits credentials → POST /api/auth/login
2. Server validates email + password (bcrypt compare)
3. Server generates JWT token with payload: { id, email, role, employeeId }
4. Token returned in response body AND set as httpOnly cookie

Subsequent requests:
5. Token read from cookie (preferred) or Authorization: Bearer header
6. `protect` middleware verifies JWT signature + expiration
7. Decoded payload attached to req.user
8. Route handlers access current user via req.user

Logout:
9. POST /api/auth/logout clears the httpOnly cookie
```

### Authorization Model

The system uses a **dual authorization** approach:

1. **Role-based (legacy):** `authorize('admin', 'manager')` — Quick check by role name
2. **Permission-based (primary):** `authorizePermission('leave_requests', 'approve')` — DB-backed granular check

Admin users bypass permission checks entirely. Manager and employee permissions are configured in the Permissions module.

### Default Permissions by Role

| Resource | Admin | Manager | Employee |
|---|---|---|---|
| leave_requests:create | ✅ | ✅ | ✅ |
| leave_requests:approve | ✅ | ✅ | ❌ |
| leave_requests:reject | ✅ | ✅ | ❌ |
| leave_requests:cancel | ✅ | ❌ | ✅ |
| employees:read | ✅ | ✅ (team only) | ❌ |
| employees:create/update/delete | ✅ | ❌ | ❌ |
| reports:read | ✅ | ✅ | ❌ |
| admin features | ✅ | ❌ | ❌ |

---

## 8. Real-Time Communication

### Socket.IO Architecture

```
                  ┌──────────────┐
                  │  Socket.IO   │
                  │   Server     │
                  └──────┬───────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Client 1 │ │ Client 2 │ │ Client N │
      │ (Admin)  │ │(Employee)│ │(Manager) │
      └──────────┘ └──────────┘ └──────────┘
```

### Events

| Event | Direction | Purpose |
|---|---|---|
| `join` | Client → Server | Join user-specific room (`user:${userId}`) |
| `notification` | Server → Client | New notification created |
| `leave_request:created` | Server → Client | New leave request submitted |
| `leave_request:approved` | Server → Client | Leave request approved |
| `leave_request:rejected` | Server → Client | Leave request rejected |

### Fallback

A 30-second polling interval is used as a fallback when WebSocket connections fail, ensuring notifications are still delivered.

---

## 9. Email System

### Email Provider

The system uses **Resend** for transactional email sending. When no API key is configured, email falls back to logging.

### Email Types

| Email Type | Trigger | Template |
|---|---|---|
| Password Reset | User clicks "Forgot Password" | HTML with reset link button |
| Leave Approved | Manager/admin approves request | HTML with status badge and details |
| Leave Rejected | Manager/admin rejects request | HTML with rejection reason |
| Leave Submitted | Employee submits new request | HTML notification to managers |
| Upcoming Reminder | Daily cron job at 8 AM | HTML reminder for next-day leaves |

### Cron Jobs

A `node-cron` scheduler runs daily at 8:00 AM to send upcoming leave reminders. It queries for approved leaves starting the next day and sends both in-app notifications and emails.

---

## 10. Security Architecture

### Layers of Security

```
Layer 1 — Transport: HTTPS (via reverse proxy)
Layer 2 — Headers: Helmet (X-Frame-Options, XSS-Protection, etc.)
Layer 3 — Authentication: JWT with httpOnly cookies
Layer 4 — CSRF: X-Requested-With header check
Layer 5 — Rate Limiting: express-rate-limit on auth routes
Layer 6 — Input Validation: Zod schemas on all POST/PUT/PATCH
Layer 7 — XSS Prevention: Request body/query sanitization
Layer 8 — Size Limits: 1MB JSON, 5MB file uploads
Layer 9 — Authorization: Role + Permission middleware
Layer 10 — Error Handling: Centralized, no stack leaks
```

### JWT Configuration

- **Secret:** Strong random value (min 64 hex chars), required env variable
- **Expiration:** Default 7 days, configurable via `JWT_EXPIRES_IN`
- **Storage:** httpOnly cookie (primary) + Bearer header (fallback)
- **Payload:** User ID, email, role name, employee ID

### File Upload Security

- **Allowed types:** JPEG, PNG, GIF, PDF (leave attachments); CSV, Excel (bulk import); Images (profile)
- **Max size:** 5MB
- **Storage:** Local filesystem (`uploads/` directory), served via Express static
- **Filename:** Unique timestamp + random suffix to prevent collisions

---

## 11. Data Flow Examples

### Example: Employee Applies for Leave

```
1. Employee fills form → POST /api/leave-requests
2. protect middleware → JWT verification
3. multer middleware → File upload processing (if any)
4. Controller:
   a. Validate employee belongs to authenticated user
   b. Check leave type exists and is active
   c. Validate leave policy (max consecutive days, notice period)
   d. Check for overlapping leave requests
   e. Verify sufficient leave balance
   f. Create LeaveRequest with status='pending'
   g. Create AuditLog entry
   h. Create Notification for manager
   i. Send email notification to manager
   j. Emit Socket.IO event to manager's room
5. Return created LeaveRequest → 201 Created
```

### Example: Admin Approves Leave

```
1. Admin clicks "Approve" → PATCH /api/leave-requests/42/approve
2. protect → JWT verification
3. authorizePermission('leave_requests', 'approve') → Permission check
4. Controller:
   a. Find leave request (must be 'pending')
   b. Verify admin's department scope (manager can only approve own dept)
   c. Update status to 'approved'
   d. Set approverId to current admin
   e. Deduct leave balance (transactional)
   f. Create multi-level approval record
   g. Create AuditLog entry
   h. Create Notification for employee
   i. Send email notification to employee
   j. Emit Socket.IO event to employee's room
5. Return updated LeaveRequest → 200 OK
```

---

## 12. Design Decisions

### Why httpOnly Cookies for JWT?

- **Prevents XSS token theft** — JavaScript cannot access httpOnly cookies
- **Automatic inclusion** — Cookies are sent with every request automatically
- **CSRF mitigation** — Combined with `X-Requested-With: XMLHttpRequest` header check
- **Fallback Bearer header** — Supports clients that can't use cookies (e.g., mobile apps)

### Why SQL Migrations Instead of Sequelize Sync?

- **Version control** — Migrations are tracked in Git and can be reviewed
- **Fine-grained control** — Custom indexes, fulltext indexes, and advanced SQL features
- **Production safety** — No accidental schema changes from model updates
- **Rollback capability** — Migration runner supports status tracking

### Why Local File Storage Instead of S3/Cloud?

- **Simpler deployment** — No cloud configuration needed for self-hosted deployments
- **Lower cost** — No additional storage service costs
- **Adequate for school use** — File volume is low (attachments, profile pictures)
- **Easy migration** — Files are Docker volumes; switching to S3 is a future enhancement

### Why Not a Monorepo?

- **Independent deployments** — Backend and frontend can be scaled and deployed separately
- **Clear separation of concerns** — Each project has its own dependencies, build, and test config
- **Team specialization** — Different teams could own frontend and backend independently

---

*For deployment instructions, see the [Deployment Guide](deployment.md).*
