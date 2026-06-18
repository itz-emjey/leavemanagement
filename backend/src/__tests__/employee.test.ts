import request from 'supertest';
import app from '../app';
import { Employee, User, Department, LeaveBalance, LeaveType, AuditLog } from '../models';
import bcrypt from 'bcrypt';

// Mock all model dependencies
jest.mock('../models', () => ({
  Employee: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Role: {},
  Department: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  LeaveBalance: {
    create: jest.fn(),
  },
  LeaveType: {
    findAll: jest.fn(),
  },
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 1, email: 'admin@test.com', roleId: 1, role: 'admin' })),
}));

// Mock Permission and Role model imports in rbac.ts to prevent Sequelize init()
jest.mock('../models/Permission', () => ({}));
jest.mock('../models/Role', () => ({}));

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

describe('Employee Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('should return paginated employees', async () => {
      const mockEmployees = [
        { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP-001', email: 'john@test.com', position: 'Dev', department: { id: 1, name: 'Engineering' }, user: { id: 1, email: 'john@test.com', isActive: true, roleId: 3, role: { name: 'employee' } } },
      ];

      (Employee.findAndCountAll as jest.Mock).mockResolvedValue({ count: 1, rows: mockEmployees });

      const res = await request(app)
        .get('/api/employees')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.employees).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });

    it('should filter by search query', async () => {
      (Employee.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] });

      const res = await request(app)
        .get('/api/employees?search=john')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should return 404 for non-existent employee', async () => {
      (Employee.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/employees/999')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(404);
    });

    it('should return employee by id', async () => {
      const mockEmployee = { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP-001', deletedAt: null };
      (Employee.findByPk as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/employees/1')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(res.body.employee).toBeDefined();
    });
  });

  describe('POST /api/employees (create)', () => {
    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ firstName: 'John' })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Validation failed');
    });

    it('should create employee successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue({ id: 2, email: 'new@test.com' });
      (Employee.create as jest.Mock).mockResolvedValue({ id: 2, firstName: 'Jane', lastName: 'Smith', employeeId: 'EMP-002' });
      (LeaveType.findAll as jest.Mock).mockResolvedValue([{ id: 1, defaultDays: 15 }, { id: 2, defaultDays: 10 }]);

      const res = await request(app)
        .post('/api/employees')
        .send({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          password: 'password123',
          position: 'Engineer',
          departmentId: '1',
          hireDate: '2025-01-15',
        })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should return 404 for non-existent employee', async () => {
      (Employee.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/employees/999')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(404);
    });

    it('should soft delete employee', async () => {
      const mockEmployee = { id: 1, firstName: 'John', lastName: 'Doe', employeeId: 'EMP-001', destroy: jest.fn(), deletedAt: null };
      (Employee.findByPk as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete('/api/employees/1')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(mockEmployee.destroy).toHaveBeenCalled();
    });
  });
});
