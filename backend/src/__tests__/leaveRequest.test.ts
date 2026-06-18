import request from 'supertest';
import app from '../app';
import { LeaveRequest, LeaveBalance, Employee, LeaveType, User, Notification, AuditLog } from '../models';

// Mock all model dependencies
jest.mock('../models', () => ({
  LeaveRequest: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
  LeaveBalance: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Employee: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  LeaveType: {
    findByPk: jest.fn(),
  },
  Department: {},
  User: {
    findAll: jest.fn(),
  },
  Notification: {
    create: jest.fn(),
  },
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock('../models/LeavePolicy', () => ({
  findOne: jest.fn(),
}));

// Mock Permission and Role model imports in rbac.ts to prevent Sequelize init()
jest.mock('../models/Permission', () => ({}));
jest.mock('../models/Role', () => ({}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 1, email: 'admin@test.com', roleId: 1, role: 'admin' })),
}));

jest.mock('../utils/email', () => ({
  sendLeaveNotificationEmail: jest.fn(),
}));

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn((cb: any) => cb({})),
  },
}));

jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    protect: (req: any, _res: any, next: any) => {
      req.user = { userId: 1, email: 'admin@test.com', roleId: 1, role: 'admin' };
      next();
    },
  };
});

describe('Leave Request Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leave-requests', () => {
    it('should return paginated leave requests', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValue(null);
      (LeaveRequest.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [{
          id: 1,
          employeeId: 1,
          leaveTypeId: 1,
          startDate: '2025-03-01',
          endDate: '2025-03-03',
          duration: 2,
          status: 'pending',
          employee: { id: 1, firstName: 'John', lastName: 'Doe' },
          leaveType: { id: 1, name: 'Annual', color: '#5B5FEF' },
        }],
      });

      const res = await request(app)
        .get('/api/leave-requests')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.requests).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValue(null);
      (LeaveRequest.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] });

      const res = await request(app)
        .get('/api/leave-requests?status=approved')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/leave-requests (create)', () => {
    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/leave-requests')
        .send({ leaveTypeId: '1' })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
    });

    it('should return 404 if employee profile not found', async () => {
      (Employee.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/leave-requests')
        .send({
          leaveTypeId: '1',
          startDate: '2025-03-10',
          endDate: '2025-03-12',
          duration: 3,
          reason: 'Personal reasons',
        })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(404);
    });

    it('should create leave request successfully', async () => {
      const mockEmployee = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@test.com', userId: 1, managerId: null };
      (Employee.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      (LeaveRequest.findOne as jest.Mock).mockResolvedValue(null); // no overlap
      (LeaveBalance.findOne as jest.Mock).mockResolvedValue({ remaining: 10 });
      (LeaveRequest.create as jest.Mock).mockResolvedValue({
        id: 1,
        employeeId: 1,
        leaveTypeId: 1,
        startDate: '2025-03-10',
        endDate: '2025-03-12',
        duration: 3,
        status: 'pending',
      });
      (User.findAll as jest.Mock).mockResolvedValue([]);
      (LeaveType.findByPk as jest.Mock).mockResolvedValue({ name: 'Annual' });

      const res = await request(app)
        .post('/api/leave-requests')
        .send({
          leaveTypeId: '1',
          startDate: '2025-03-10',
          endDate: '2025-03-12',
          duration: 3,
          reason: 'Family event',
        })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/leave-requests/:id/approve', () => {
    it('should return 404 for non-existent request', async () => {
      (LeaveRequest.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/leave-requests/999/approve')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(404);
    });

    it('should approve pending request', async () => {
      const mockRequest = {
        id: 1,
        employeeId: 1,
        leaveTypeId: 1,
        duration: 3,
        status: 'pending',
        startDate: '2025-03-10',
        endDate: '2025-03-12',
        update: jest.fn(),
      };
      const mockBalance = { remaining: 10, used: 0, update: jest.fn() };

      (LeaveRequest.findByPk as jest.Mock).mockResolvedValue(mockRequest);
      (Employee.findByPk as jest.Mock).mockResolvedValue({ id: 1, firstName: 'John', lastName: 'Doe', userId: 1, email: 'john@test.com' });
      (Employee.findOne as jest.Mock).mockResolvedValue({ id: 2 }); // approver
      (LeaveBalance.findOne as jest.Mock).mockResolvedValue(mockBalance);
      (LeaveType.findByPk as jest.Mock).mockResolvedValue({ name: 'Annual' });
      // Notification.create must return an object with title/message/type/link
      (Notification.create as jest.Mock).mockResolvedValue({
        title: 'Leave Approved',
        message: 'Your leave has been approved.',
        type: 'leave_approved',
        link: '/leave-requests',
      });

      const res = await request(app)
        .patch('/api/leave-requests/1/approve')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/leave-requests/:id/cancel', () => {
    it('should only cancel pending requests', async () => {
      (LeaveRequest.findByPk as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'approved',
      });

      const res = await request(app)
        .patch('/api/leave-requests/1/cancel')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
    });
  });
});
