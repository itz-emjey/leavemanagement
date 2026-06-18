import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import xss from 'xss';
import config from './config/constants';
import { logger } from './utils/logger';
import { structuredLogger } from './middleware/logger';
import * as os from 'os';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import employeeRoutes from './routes/employeeRoutes';
import leaveCreditRoutes from './routes/leaveCreditRoutes';
import leaveRequestRoutes from './routes/leaveRequestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import holidayRoutes from './routes/holidayRoutes';
import leaveTypeRoutes from './routes/leaveTypeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import leavePolicyRoutes from './routes/leavePolicyRoutes';
import leaveRequestApprovalRoutes from './routes/leaveRequestApprovalRoutes';
import permissionRoutes from './routes/permissionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import systemConfigRoutes from './routes/systemConfigRoutes';
import calendarRoutes from './routes/calendarRoutes';
import leavePatternRoutes from './routes/leavePatternRoutes';
import { errorHandler } from './utils/AppError';
import { csrfProtection } from './middleware/auth';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/swagger';

// ── Sentry Initialization ─────────────────────────────────
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.nodeEnv,
    integrations: [
      Sentry.expressIntegration(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: config.nodeEnv === 'production' ? 0.2 : 0.5,
    profilesSampleRate: config.nodeEnv === 'production' ? 0.2 : 0.5,
  });
  logger.info('Sentry initialized for error tracking.');
} else {
  logger.warn('SENTRY_DSN not configured. Error tracking disabled.');
}

const app = express();

// Structured request logging (attaches requestId, logs incoming/outgoing requests)
app.use(structuredLogger);

// Compression middleware (gzip/brotli for API responses)
app.use(compression({
  threshold: 256, // compress responses >= 256 bytes
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// Response time tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        status: res.statusCode,
      });
    }
  });
  next();
});

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disabled for SPA with Vite dev server
}));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Cookie parser (needed for httpOnly JWT cookies)
app.use(cookieParser(config.session.cookieSecret));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request body size limiter for multipart
app.use((req, _res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 5 * 1024 * 1024) { // 5MB max
    _res.status(413).json({ message: 'Request body too large.' });
    return;
  }
  next();
});

// XSS sanitization middleware
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
});

function sanitizeObject(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key].forEach((item: any, index: number) => {
        if (typeof item === 'string') {
          obj[key][index] = xss(item);
        } else if (item && typeof item === 'object') {
          sanitizeObject(item);
        }
      });
    } else if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

// CSRF protection for API routes
app.use('/api', csrfProtection);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Swagger UI Documentation ─────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Leave Management System - API Docs',
}));

// ── Server start time for uptime tracking ────────────────
const startTime = Date.now();

// Track request counts for metrics
let totalRequests = 0;
let activeRequests = 0;
const requestCountsByMethod: Record<string, number> = {};
const requestCountsByRoute: Record<string, number> = {};

// Request counting middleware
app.use((req, res, next) => {
  totalRequests++;
  activeRequests++;
  const method = req.method;
  requestCountsByMethod[method] = (requestCountsByMethod[method] || 0) + 1;

  res.on('finish', () => {
    activeRequests--;
    // req.route is populated by Express after route matching, so we access it here
    const route = req.route?.path || req.originalUrl;
    requestCountsByRoute[route] = (requestCountsByRoute[route] || 0) + 1;
  });

  next();
});

// Enhanced health check with uptime, DB status, and memory info
app.get('/api/health', async (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

  let dbStatus = 'unknown';
  try {
    const sequelize = (await import('./config/database')).default;
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      human: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds % 60}s`,
    },
    environment: config.nodeEnv,
    database: dbStatus,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  });
});

// Application metrics endpoint (for prometheus-style monitoring)
app.get('/api/metrics', (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    uptime: uptimeSeconds,
    requests: {
      total: totalRequests,
      active: activeRequests,
      byMethod: requestCountsByMethod,
      byRoute: requestCountsByRoute,
    },
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
    },
    cpu: {
      loadAvg: os.loadavg(),
      cpus: os.cpus().length,
    },
    environment: config.nodeEnv,
    nodeVersion: process.version,
    platform: process.platform,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-credits', leaveCreditRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/leave-types', leaveTypeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leave-policies', leavePolicyRoutes);
app.use('/api/leave-request-approvals', leaveRequestApprovalRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/system-config', systemConfigRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leave-patterns', leavePatternRoutes);

// Sentry error handler (must be before the generic error handler)
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use(errorHandler);

// PDF Report Export
app.get('/api/reports/export-pdf', async (req, res) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const { generateReportPDF } = await import('./utils/pdfGenerator');
    const { LeaveRequest, LeaveType, Department, Employee } = await import('./models');
    const { Op, fn, col } = await import('sequelize');

    const totalRequests = await LeaveRequest.count({
      where: { startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
    });
    const approvedRequests = await LeaveRequest.count({
      where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
    });
    const pendingRequests = await LeaveRequest.count({
      where: { status: 'pending', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
    });
    const rejectedRequests = await LeaveRequest.count({
      where: { status: 'rejected', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
    });
    const totalDaysResult = await LeaveRequest.findAll({
      where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
      attributes: [[fn('SUM', col('duration')), 'totalDays']],
      raw: true,
    });
    interface SummaryRow { totalDays: number; }
    interface TrendRow { month: number; count: number; status: string; }
    interface DistributionRow { 'leaveType.name': string; 'leaveType.color': string; totalDays: number; }
    interface DepartmentRow { name: string; totalDays: number; employeeCount: number; }

    const totalDays = Number((totalDaysResult as unknown as SummaryRow[])[0]?.totalDays) || 0;
    const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

    const trends = await LeaveRequest.findAll({
      where: { status: { [Op.in]: ['approved', 'rejected'] }, startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
      attributes: [[fn('MONTH', col('startDate')), 'month'], [fn('COUNT', col('id')), 'count'], 'status'],
      group: [fn('MONTH', col('startDate')), 'status'],
      raw: true,
    }) as unknown as TrendRow[];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyTrends = monthNames.map((_month, i) => {
      const approved = trends.find((r) => r.month === i + 1 && r.status === 'approved');
      const rejected = trends.find((r) => r.month === i + 1 && r.status === 'rejected');
      return { month: monthNames[i], approved: approved ? Number(approved.count) : 0, rejected: rejected ? Number(rejected.count) : 0 };
    });

    const distribution = await LeaveRequest.findAll({
      where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      attributes: [[fn('SUM', col('LeaveRequest.duration')), 'totalDays'], 'leaveTypeId'],
      group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
      raw: true,
    });
    const leaveTypeDistribution = (distribution as unknown as DistributionRow[]).map((item) => ({
      name: item['leaveType.name'] || 'Unknown', value: Number(item.totalDays) || 0, color: item['leaveType.color'] || '#3B82F6',
    }));

    const departments = await Department.findAll({
      include: [{ model: Employee, as: 'employees', attributes: [], include: [{ model: LeaveRequest, as: 'leaveRequests', where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } }, attributes: [] }] }],
      attributes: ['id','name', [fn('COALESCE', fn('SUM', col('employees->leaveRequests.duration')), 0), 'totalDays'], [fn('COUNT', fn('DISTINCT', col('employees.id'))), 'employeeCount']],
      group: ['Department.id', 'Department.name'], raw: true,
    }) as unknown as DepartmentRow[];
    const departmentComparison = departments.map((d) => ({
      department: d.name, totalDays: Number(d.totalDays) || 0, employeeCount: Number(d.employeeCount) || 0,
      avgDaysPerEmployee: Number(d.employeeCount) > 0 ? (Number(d.totalDays) / Number(d.employeeCount)).toFixed(1) : '0',
    }));

    const doc = generateReportPDF({
      title: 'Leave Management Report',
      year,
      summary: { totalRequests, approvedRequests, pendingRequests, rejectedRequests, totalDays, approvalRate },
      monthlyTrends,
      leaveTypeDistribution,
      departmentComparison,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=leave-report-${year}.pdf`);
    doc.pipe(res);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
});

export default app;
