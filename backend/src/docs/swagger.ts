/**
 * ──────────────────────────────────────────────────────────
 * OpenAPI 3.0 Specification — Leave Management System API
 * ──────────────────────────────────────────────────────────
 *
 * This file contains the complete OpenAPI specification for the
 * Leave Management System backend API. It is served via Swagger UI
 * at GET /api/docs when the server is running.
 *
 * To view: start the backend server and navigate to /api/docs
 * ──────────────────────────────────────────────────────────
 */

export const openApiSpec: Record<string, unknown> = {
  openapi: '3.0.3',
  info: {
    title: 'Leave Management System API',
    version: '1.0.0',
    description: `RESTful API for managing employee leave requests, approvals, balances, and reports.
      
## Authentication
Most endpoints require a JWT token. The token can be provided via:
- **httpOnly cookie** (set automatically on login)
- **Bearer token** in the Authorization header

Use the \`POST /api/auth/login\` endpoint to authenticate.

## Roles
- **admin** — Full system access
- **manager** — Department-level access (approve/reject, view team)
- **employee** — Self-service access (apply, view own requests)

## Permission System
Admin users bypass permission checks. Managers and employees have
granular permissions configured in the Permissions module.
`,
    contact: {
      email: 'support@leavemanagement.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
    {
      url: 'https://api.leavemanagement.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token. You can also use httpOnly cookies for auth.',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token stored in httpOnly cookie (auto-set on login).',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Validation failed.' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'admin@company.com' },
          role: { type: 'string', example: 'admin' },
          employee: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer', example: 1 },
              firstName: { type: 'string', example: 'System' },
              lastName: { type: 'string', example: 'Admin' },
              employeeId: { type: 'string', example: 'EMP-0001' },
              position: { type: 'string', example: 'System Administrator' },
              profilePicture: { type: 'string', nullable: true },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@company.com' },
          password: { type: 'string', format: 'password', example: 'admin123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          employeeId: { type: 'string', example: 'EMP-0001' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', example: 'john@company.com' },
          position: { type: 'string', example: 'Software Engineer' },
          departmentId: { type: 'integer', example: 1 },
          phone: { type: 'string', nullable: true, example: '+1-555-0123' },
          hireDate: { type: 'string', format: 'date', example: '2024-01-15' },
          profilePicture: { type: 'string', nullable: true },
          managerId: { type: 'integer', nullable: true, example: 2 },
          dateOfBirth: { type: 'string', format: 'date', nullable: true, example: '1990-05-20' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          department: { $ref: '#/components/schemas/Department' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      CreateEmployeeRequest: {
        type: 'object',
        required: ['employeeId', 'firstName', 'lastName', 'email', 'position', 'departmentId', 'hireDate'],
        properties: {
          employeeId: { type: 'string', example: 'EMP-0042' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Smith' },
          email: { type: 'string', format: 'email', example: 'jane@company.com' },
          position: { type: 'string', example: 'Product Manager' },
          departmentId: { type: 'integer', example: 1 },
          phone: { type: 'string', example: '+1-555-0124' },
          hireDate: { type: 'string', format: 'date', example: '2024-06-01' },
          password: { type: 'string', format: 'password', example: 'initialPass123' },
          managerId: { type: 'integer', example: 2 },
          dateOfBirth: { type: 'string', format: 'date', example: '1992-03-15' },
        },
      },
      LeaveRequest: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          employeeId: { type: 'integer', example: 1 },
          leaveTypeId: { type: 'integer', example: 1 },
          startDate: { type: 'string', format: 'date', example: '2024-07-15' },
          endDate: { type: 'string', format: 'date', example: '2024-07-19' },
          duration: { type: 'number', example: 5 },
          durationType: { type: 'string', enum: ['full', 'half', 'hourly'], example: 'full' },
          startTime: { type: 'string', nullable: true, example: '09:00' },
          endTime: { type: 'string', nullable: true, example: '13:00' },
          reason: { type: 'string', example: 'Family vacation' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'], example: 'pending' },
          approverId: { type: 'integer', nullable: true, example: 2 },
          rejectionReason: { type: 'string', nullable: true },
          attachment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          employee: { $ref: '#/components/schemas/Employee' },
          leaveType: { $ref: '#/components/schemas/LeaveType' },
          approver: { $ref: '#/components/schemas/Employee' },
        },
      },
      CreateLeaveRequest: {
        type: 'object',
        required: ['leaveTypeId', 'startDate', 'endDate'],
        properties: {
          leaveTypeId: { type: 'integer', example: 1 },
          startDate: { type: 'string', format: 'date', example: '2024-07-15' },
          endDate: { type: 'string', format: 'date', example: '2024-07-19' },
          duration: { type: 'number', example: 5 },
          durationType: { type: 'string', enum: ['full', 'half', 'hourly'], example: 'full' },
          startTime: { type: 'string', example: '09:00' },
          endTime: { type: 'string', example: '13:00' },
          reason: { type: 'string', example: 'Family vacation' },
        },
      },
      LeaveType: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Annual Leave' },
          description: { type: 'string', example: 'Yearly paid vacation leave' },
          defaultDays: { type: 'integer', example: 12 },
          color: { type: 'string', example: '#3B82F6' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateLeaveTypeRequest: {
        type: 'object',
        required: ['name', 'defaultDays'],
        properties: {
          name: { type: 'string', example: 'Study Leave' },
          description: { type: 'string', example: 'Leave for educational purposes' },
          defaultDays: { type: 'integer', example: 10 },
          color: { type: 'string', example: '#8B5CF6' },
        },
      },
      Department: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Engineering' },
          description: { type: 'string', example: 'Software Engineering Department' },
          employeeCount: { type: 'integer', example: 15 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateDepartmentRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Design' },
          description: { type: 'string', example: 'UI/UX Design Department' },
        },
      },
      Holiday: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'New Year' },
          date: { type: 'string', format: 'date', example: '2024-01-01' },
          isRecurring: { type: 'boolean', example: true },
          type: { type: 'string', example: 'public' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateHolidayRequest: {
        type: 'object',
        required: ['name', 'date'],
        properties: {
          name: { type: 'string', example: 'Christmas' },
          date: { type: 'string', format: 'date', example: '2024-12-25' },
          isRecurring: { type: 'boolean', example: true },
          type: { type: 'string', example: 'public' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Leave Approved' },
          message: { type: 'string', example: 'Your Annual Leave has been approved.' },
          type: { type: 'string', example: 'leave_approved' },
          link: { type: 'string', example: '/leave-requests' },
          isRead: { type: 'boolean', example: false },
          isEmailSent: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LeaveBalance: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          employeeId: { type: 'integer', example: 1 },
          leaveTypeId: { type: 'integer', example: 1 },
          allocated: { type: 'number', example: 12 },
          used: { type: 'number', example: 3 },
          remaining: { type: 'number', example: 9 },
          year: { type: 'integer', example: 2024 },
          leaveType: { $ref: '#/components/schemas/LeaveType' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', nullable: true },
          action: { type: 'string', example: 'LEAVE_APPROVED' },
          entity: { type: 'string', example: 'LeaveRequest' },
          entityId: { type: 'integer', example: 42 },
          details: { type: 'string', example: 'Approved leave request #42' },
          ipAddress: { type: 'string', example: '192.168.1.1' },
          userAgent: { type: 'string', example: 'Mozilla/5.0...' },
          createdAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      LeavePolicy: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          leaveTypeId: { type: 'integer', example: 1 },
          maxConsecutiveDays: { type: 'integer', example: 15 },
          minNoticeDays: { type: 'integer', example: 1 },
          carryOverLimit: { type: 'integer', example: 5 },
          requiresApproval: { type: 'boolean', example: true },
          isActive: { type: 'boolean', example: true },
          accrualRule: { type: 'string', enum: ['none', 'monthly', 'quarterly', 'yearly'], example: 'yearly' },
          leaveType: { $ref: '#/components/schemas/LeaveType' },
        },
      },
      LeavePattern: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          employeeId: { type: 'integer', example: 1 },
          leaveTypeId: { type: 'integer', example: 1 },
          frequency: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'], example: 'weekly' },
          dayOfWeek: { type: 'integer', example: 3 },
          weekOfMonth: { type: 'integer', nullable: true, example: 2 },
          startDate: { type: 'string', format: 'date', example: '2024-01-01' },
          endDate: { type: 'string', format: 'date', nullable: true },
          status: { type: 'string', enum: ['active', 'paused', 'cancelled'], example: 'active' },
          reason: { type: 'string', nullable: true },
          employee: { $ref: '#/components/schemas/Employee' },
          leaveType: { $ref: '#/components/schemas/LeaveType' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      DashboardAdmin: {
        type: 'object',
        properties: {
          kpis: {
            type: 'object',
            properties: {
              totalEmployees: { type: 'integer', example: 50 },
              activeRequests: { type: 'integer', example: 12 },
              pendingApprovals: { type: 'integer', example: 5 },
              approvedThisMonth: { type: 'integer', example: 23 },
              totalDepartments: { type: 'integer', example: 5 },
              utilizationRate: { type: 'number', example: 72.5 },
            },
          },
          calendarEvents: { type: 'array', items: { type: 'object' } },
          monthlyTrends: { type: 'array', items: { type: 'object' } },
          leaveTypeDistribution: { type: 'array', items: { type: 'object' } },
          recentActivities: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
          recentLeaveRequests: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } },
        },
      },
      DashboardEmployee: {
        type: 'object',
        properties: {
          kpis: {
            type: 'object',
            properties: {
              totalRequests: { type: 'integer', example: 8 },
              pendingRequests: { type: 'integer', example: 2 },
              approvedDays: { type: 'number', example: 15 },
              remainingDays: { type: 'number', example: 10 },
            },
          },
          balances: { type: 'array', items: { $ref: '#/components/schemas/LeaveBalance' } },
          calendarEvents: { type: 'array', items: { type: 'object' } },
          recentRequests: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: {
            type: 'object',
            properties: {
              seconds: { type: 'integer', example: 3600 },
              human: { type: 'string', example: '1h 0m 0s' },
            },
          },
          environment: { type: 'string', example: 'development' },
          database: { type: 'string', example: 'connected' },
          memory: {
            type: 'object',
            properties: {
              rss: { type: 'string', example: '45 MB' },
              heapTotal: { type: 'string', example: '32 MB' },
              heapUsed: { type: 'string', example: '28 MB' },
            },
          },
        },
      },
      MetricsResponse: {
        type: 'object',
        properties: {
          uptime: { type: 'integer', example: 3600 },
          requests: {
            type: 'object',
            properties: {
              total: { type: 'integer', example: 1000 },
              active: { type: 'integer', example: 3 },
              byMethod: {
                type: 'object',
                properties: {
                  GET: { type: 'integer', example: 700 },
                  POST: { type: 'integer', example: 200 },
                  PATCH: { type: 'integer', example: 80 },
                  DELETE: { type: 'integer', example: 20 },
                },
              },
            },
          },
          memory: {
            type: 'object',
            properties: {
              rss: { type: 'integer', example: 47185920 },
              heapTotal: { type: 'integer', example: 33554432 },
              heapUsed: { type: 'integer', example: 29360128 },
            },
          },
          cpu: {
            type: 'object',
            properties: {
              loadAvg: { type: 'array', items: { type: 'number' }, example: [1.5, 1.2, 1.0] },
              cpus: { type: 'integer', example: 8 },
            },
          },
          nodeVersion: { type: 'string', example: 'v20.11.0' },
          platform: { type: 'string', example: 'linux' },
        },
      },
      Permission: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roleId: { type: 'integer' },
          resource: { type: 'string' },
          action: { type: 'string' },
          allowed: { type: 'boolean' },
          role: { $ref: '#/components/schemas/Role' },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      SystemConfig: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          key: { type: 'string' },
          value: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['string', 'number', 'boolean', 'json'] },
          group: { type: 'string', enum: ['general', 'leave', 'email', 'system'] },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required — missing or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Invalid or expired token.' },
          },
        },
      },
      Forbidden: {
        description: 'Access denied — insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Access denied. Insufficient permissions.' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: { message: 'Resource not found.' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  paths: {
    // ─── Authentication ──────────────────────────────────────
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns a JWT token. The token is also set as an httpOnly cookie.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '429': { description: 'Too many login attempts. Rate limited to 20 per 15 minutes.' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout',
        description: 'Clears the auth cookie. Requires authentication.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset',
        description: 'Sends a password reset email with a reset link. Rate limited to 5 per hour.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email', example: 'john@company.com' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reset email sent if email exists' },
          '429': { description: 'Too many requests. Rate limited to 5 per hour.' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        description: 'Resets the password using a token received via email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', example: 'reset-token-from-email' },
                  password: { type: 'string', format: 'password', example: 'newPassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successfully' },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change password (authenticated)',
        description: 'Changes the password for the currently authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', format: 'password', example: 'oldPassword123' },
                  newPassword: { type: 'string', format: 'password', example: 'newPassword456' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed successfully' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        description: 'Returns the profile of the currently authenticated user.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/profile': {
      put: {
        tags: ['Authentication'],
        summary: 'Update user profile',
        description: 'Updates the profile of the currently authenticated user. Supports profile picture upload.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string' },
                  profilePicture: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated successfully' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ─── Dashboard ─────────────────────────────────────────
    '/api/dashboard/admin': {
      get: {
        tags: ['Dashboard'],
        summary: 'Admin dashboard data',
        description: 'Returns KPIs, calendar events, trends, distribution, and recent activities for the admin dashboard.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Admin dashboard data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardAdmin' } } },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/dashboard/employee': {
      get: {
        tags: ['Dashboard'],
        summary: 'Employee dashboard data',
        description: 'Returns KPIs, leave balances, calendar events, and recent requests for the employee dashboard.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Employee dashboard data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardEmployee' } } },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ─── Employees ──────────────────────────────────────────
    '/api/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees',
        description: 'Returns a paginated list of employees. Supports search, filter by department, and sorting. Admin/Manager only.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name, email, or employee ID' },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' } },
          { name: 'includeInactive', in: 'query', schema: { type: 'boolean', default: false } },
        ],
        responses: {
          '200': {
            description: 'Paginated employee list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    employees: { type: 'array', items: { $ref: '#/components/schemas/Employee' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create employee',
        description: 'Creates a new employee record along with a corresponding user account. Admin only.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEmployeeRequest' } } },
        },
        responses: {
          '201': { description: 'Employee created' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/employees/{id}': {
      get: {
        tags: ['Employees'],
        summary: 'Get employee by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Employee details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Employees'],
        summary: 'Update employee',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateEmployeeRequest' } } },
        },
        responses: {
          '200': { description: 'Employee updated' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Soft-delete employee',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Employee deleted successfully' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/employees/import': {
      post: {
        tags: ['Employees'],
        summary: 'Bulk import employees (CSV/Excel)',
        description: 'Imports employees from a CSV or Excel file. Admin only.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Import completed' },
          '400': { description: 'Invalid file format' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/employees/{id}/toggle-status': {
      patch: {
        tags: ['Employees'],
        summary: 'Toggle employee active status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Status toggled' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/employees/{id}/reset-password': {
      post: {
        tags: ['Employees'],
        summary: 'Reset employee password',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { newPassword: { type: 'string', format: 'password' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successfully' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ─── Leave Requests ────────────────────────────────────
    '/api/leave-requests': {
      get: {
        tags: ['Leave Requests'],
        summary: 'List leave requests',
        description: 'Returns a paginated list of leave requests. Employees see only their own; admins/managers see all.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'cancelled'] } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Paginated leave requests',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    requests: { type: 'array', items: { $ref: '#/components/schemas/LeaveRequest' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Leave Requests'],
        summary: 'Create leave request',
        description: 'Creates a new leave request. Supports file attachments. Validates balance and overlap.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/CreateLeaveRequest' },
                  { type: 'object', properties: { attachment: { type: 'string', format: 'binary' } } },
                ],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Leave request created' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/leave-requests/calendar': {
      get: {
        tags: ['Leave Requests'],
        summary: 'Get leave requests as calendar events',
        description: 'Returns leave requests formatted as calendar events for use with FullCalendar.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'start', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Start date range' },
          { name: 'end', in: 'query', schema: { type: 'string', format: 'date' }, description: 'End date range' },
        ],
        responses: {
          '200': { description: 'Calendar events array' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/leave-requests/{id}/approve': {
      patch: {
        tags: ['Leave Requests'],
        summary: 'Approve leave request',
        description: 'Approves a pending leave request. Deducts from leave balance and creates notifications.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Leave request approved' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/leave-requests/{id}/reject': {
      patch: {
        tags: ['Leave Requests'],
        summary: 'Reject leave request',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { reason: { type: 'string', example: 'Business conflict' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Leave request rejected' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/leave-requests/{id}/cancel': {
      patch: {
        tags: ['Leave Requests'],
        summary: 'Cancel leave request',
        description: 'Cancels a pending/approved leave request. Restores leave balance for approved leaves.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Leave request cancelled' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/leave-requests/{id}/level-approve': {
      patch: {
        tags: ['Leave Requests'],
        summary: 'Multi-level approval step',
        description: 'Approve a leave request at a specific approval level (for multi-level approval workflow).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Approval level updated' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },

    // ─── Leave Credits / Balances ──────────────────────────
    '/api/leave-credits': {
      get: {
        tags: ['Leave Credits'],
        summary: 'List leave credits',
        description: 'Returns leave balances for all employees. Admin only.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'employeeId', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Leave credits list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    credits: { type: 'array', items: { $ref: '#/components/schemas/LeaveBalance' } },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/leave-credits/adjust': {
      post: {
        tags: ['Leave Credits'],
        summary: 'Adjust leave credit for an employee',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['employeeId', 'leaveTypeId', 'newAllocated'],
                properties: {
                  employeeId: { type: 'integer' },
                  leaveTypeId: { type: 'integer' },
                  newAllocated: { type: 'number', example: 15 },
                  year: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Credit adjusted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/leave-credits/bulk-adjust': {
      post: {
        tags: ['Leave Credits'],
        summary: 'Bulk adjust leave credits',
        description: 'Adjusts leave credits for multiple employees at once.',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Bulk adjustment completed' } },
      },
    },
    '/api/leave-credits/carry-over': {
      post: {
        tags: ['Leave Credits'],
        summary: 'Carry over unused leave credits to next year',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Carry over completed' } },
      },
    },

    // ─── Leave Types ───────────────────────────────────────
    '/api/leave-types': {
      get: {
        tags: ['Leave Types'],
        summary: 'List leave types',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Leave types list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { leaveTypes: { type: 'array', items: { $ref: '#/components/schemas/LeaveType' } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Leave Types'],
        summary: 'Create leave type',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLeaveTypeRequest' } } },
        },
        responses: { '201': { description: 'Leave type created' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/leave-types/{id}': {
      put: {
        tags: ['Leave Types'],
        summary: 'Update leave type',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateLeaveTypeRequest' } } },
        },
        responses: { '200': { description: 'Leave type updated' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
      delete: {
        tags: ['Leave Types'],
        summary: 'Delete leave type',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave type deleted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    // ─── Departments ───────────────────────────────────────
    '/api/departments': {
      get: {
        tags: ['Departments'],
        summary: 'List departments',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Departments list with employee counts',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { departments: { type: 'array', items: { $ref: '#/components/schemas/Department' } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Departments'],
        summary: 'Create department',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDepartmentRequest' } } },
        },
        responses: { '201': { description: 'Department created' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/departments/{id}': {
      put: {
        tags: ['Departments'],
        summary: 'Update department',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDepartmentRequest' } } },
        },
        responses: { '200': { description: 'Department updated' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
      delete: {
        tags: ['Departments'],
        summary: 'Delete department',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Department deleted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    // ─── Holidays ──────────────────────────────────────────
    '/api/holidays': {
      get: {
        tags: ['Holidays'],
        summary: 'List holidays',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Holidays list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { holidays: { type: 'array', items: { $ref: '#/components/schemas/Holiday' } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Holidays'],
        summary: 'Create holiday',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateHolidayRequest' } } },
        },
        responses: { '201': { description: 'Holiday created' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/holidays/upcoming': {
      get: {
        tags: ['Holidays'],
        summary: 'Get upcoming holidays',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Upcoming holidays' },
        },
      },
    },
    '/api/holidays/{id}': {
      put: {
        tags: ['Holidays'],
        summary: 'Update holiday',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateHolidayRequest' } } },
        },
        responses: { '200': { description: 'Holiday updated' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
      delete: {
        tags: ['Holidays'],
        summary: 'Delete holiday',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Holiday deleted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    // ─── Leave Policies ────────────────────────────────────
    '/api/leave-policies': {
      get: {
        tags: ['Leave Policies'],
        summary: 'List leave policies',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Leave policies list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { policies: { type: 'array', items: { $ref: '#/components/schemas/LeavePolicy' } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Leave Policies'],
        summary: 'Create leave policy',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Leave policy created' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/leave-policies/{id}': {
      get: {
        tags: ['Leave Policies'],
        summary: 'Get leave policy by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave policy details' } },
      },
      put: {
        tags: ['Leave Policies'],
        summary: 'Update leave policy',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave policy updated' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
      delete: {
        tags: ['Leave Policies'],
        summary: 'Delete leave policy',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave policy deleted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    // ─── Leave Patterns ────────────────────────────────────
    '/api/leave-patterns': {
      get: {
        tags: ['Leave Patterns'],
        summary: 'List recurring leave patterns',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Leave patterns list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { patterns: { type: 'array', items: { $ref: '#/components/schemas/LeavePattern' } } },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Leave Patterns'],
        summary: 'Create recurring leave pattern',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Leave pattern created' } },
      },
    },
    '/api/leave-patterns/preview': {
      get: {
        tags: ['Leave Patterns'],
        summary: 'Preview generated dates from a pattern',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Preview dates' } },
      },
    },
    '/api/leave-patterns/{id}/generate': {
      post: {
        tags: ['Leave Patterns'],
        summary: 'Generate leave requests from a pattern',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave requests generated' } },
      },
    },
    '/api/leave-patterns/{id}': {
      patch: {
        tags: ['Leave Patterns'],
        summary: 'Update leave pattern',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave pattern updated' } },
      },
      delete: {
        tags: ['Leave Patterns'],
        summary: 'Delete leave pattern',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Leave pattern deleted' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },

    // ─── Leave Request Approvals ───────────────────────────
    '/api/leave-request-approvals/{leaveRequestId}': {
      get: {
        tags: ['Leave Request Approvals'],
        summary: 'Get approvals for a leave request',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'leaveRequestId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Approvals list' } },
      },
    },
    '/api/leave-request-approvals': {
      post: {
        tags: ['Leave Request Approvals'],
        summary: 'Create approval record',
        security: [{ bearerAuth: [] }],
        responses: { '201': { description: 'Approval created' } },
      },
    },
    '/api/leave-request-approvals/{id}': {
      patch: {
        tags: ['Leave Request Approvals'],
        summary: 'Update approval',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Approval updated' } },
      },
      delete: {
        tags: ['Leave Request Approvals'],
        summary: 'Delete approval record',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Approval deleted' } },
      },
    },

    // ─── Notifications ─────────────────────────────────────
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List user notifications',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'Notifications list with unread count',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    unreadCount: { type: 'integer', example: 3 },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Marked as read' } },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'All marked as read' } },
      },
    },

    // ─── Reports ───────────────────────────────────────────
    '/api/reports/summary': {
      get: {
        tags: ['Reports'],
        summary: 'Get report summary',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Report summary data' } },
      },
    },
    '/api/reports/trends': {
      get: {
        tags: ['Reports'],
        summary: 'Get monthly leave trends',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Monthly trends data' } },
      },
    },
    '/api/reports/leave-type-distribution': {
      get: {
        tags: ['Reports'],
        summary: 'Get leave type distribution',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Distribution data' } },
      },
    },
    '/api/reports/department-comparison': {
      get: {
        tags: ['Reports'],
        summary: 'Get department comparison',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'Department comparison data' } },
      },
    },
    '/api/reports/export-csv': {
      get: {
        tags: ['Reports'],
        summary: 'Export report as CSV',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'CSV file download' } },
      },
    },
    '/api/reports/export-pdf': {
      get: {
        tags: ['Reports'],
        summary: 'Export report as PDF',
        description: 'Generates a comprehensive PDF report with summary, trends, distribution, and department comparison.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'PDF file download' } },
      },
    },
    '/api/reports/employee-statement': {
      get: {
        tags: ['Reports'],
        summary: 'Get employee leave statement',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Employee leave statement' } },
      },
    },

    // ─── Audit Logs ────────────────────────────────────────
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List audit logs',
        description: 'Returns paginated audit logs. Admin only.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entity', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Paginated audit logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/audit-logs/actions': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get distinct audit log actions',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Available actions list' } },
      },
    },
    '/api/audit-logs/export': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Export audit logs as CSV',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'CSV file download' } },
      },
    },

    // ─── Analytics ─────────────────────────────────────────
    '/api/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics overview',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Analytics overview data' } },
      },
    },
    '/api/analytics/trends': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics trends',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Analytics trends data' } },
      },
    },
    '/api/analytics/employees': {
      get: {
        tags: ['Analytics'],
        summary: 'Get employee analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Employee analytics data' } },
      },
    },
    '/api/analytics/utilization': {
      get: {
        tags: ['Analytics'],
        summary: 'Get leave utilization analytics',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Utilization analytics data' } },
      },
    },

    // ─── Permissions ───────────────────────────────────────
    '/api/permissions': {
      get: {
        tags: ['Permissions'],
        summary: 'Get all role permissions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All permissions grouped by role',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { permissions: { type: 'array', items: { $ref: '#/components/schemas/Permission' } } },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Permissions'],
        summary: 'Update a permission',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Permission updated' } },
      },
    },
    '/api/permissions/reset': {
      post: {
        tags: ['Permissions'],
        summary: 'Reset permissions to defaults',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Permissions reset' } },
      },
    },

    // ─── System Config ─────────────────────────────────────
    '/api/system-config': {
      get: {
        tags: ['System Config'],
        summary: 'Get system configuration',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System configuration',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { configs: { type: 'array', items: { $ref: '#/components/schemas/SystemConfig' } } },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['System Config'],
        summary: 'Update system configuration',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Configuration updated' } },
      },
    },
    '/api/system-config/reset': {
      post: {
        tags: ['System Config'],
        summary: 'Reset system configuration to defaults',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Configuration reset' } },
      },
    },
    '/api/system-config/health': {
      get: {
        tags: ['System Config'],
        summary: 'Get system health status',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'System health status' } },
      },
    },

    // ─── Calendar (ICS) ────────────────────────────────────
    '/api/calendar/export': {
      get: {
        tags: ['Calendar'],
        summary: 'Export leave calendar as ICS file',
        description: 'Downloads an ICS file for calendar import (Outlook, Google Calendar, Apple Calendar).',
        responses: { '200': { description: 'ICS file download' } },
      },
    },
    '/api/calendar/webcal': {
      get: {
        tags: ['Calendar'],
        summary: 'Webcal subscription endpoint',
        description: 'Returns ICS data for live calendar subscription. Use with webcal:// protocol.',
        parameters: [{ name: 'token', in: 'query', schema: { type: 'string' }, description: 'JWT token for authentication' }],
        responses: { '200': { description: 'ICS subscription data' } },
      },
    },

    // ─── Health & Metrics ──────────────────────────────────
    '/api/health': {
      get: {
        tags: ['Monitoring'],
        summary: 'Health check endpoint',
        description: 'Returns server health status including uptime, DB connection, and memory usage.',
        responses: {
          '200': {
            description: 'Health status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
        },
      },
    },
    '/api/metrics': {
      get: {
        tags: ['Monitoring'],
        summary: 'Application metrics',
        description: 'Returns detailed metrics including request counts, memory usage, and CPU load. Useful for Prometheus-style monitoring.',
        responses: {
          '200': {
            description: 'Application metrics',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MetricsResponse' } } },
          },
        },
      },
    },
  },
};
