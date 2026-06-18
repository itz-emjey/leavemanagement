import request from 'supertest';
import app from '../app';
import { User, Employee, Role, AuditLog } from '../models';
import bcrypt from 'bcrypt';

// Mock the models
jest.mock('../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  Employee: {
    findOne: jest.fn(),
  },
  Role: {
    findOne: jest.fn(),
  },
  Department: {},
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 1, email: 'test@test.com', roleId: 1, role: 'admin' })),
}));

jest.mock('../utils/email', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

// Mock Permission and Role model imports in rbac.ts to prevent Sequelize init()
jest.mock('../models/Permission', () => ({}));
jest.mock('../models/Role', () => ({}));

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const withCsrf = (req: request.Test) => req.set('X-Requested-With', 'XMLHttpRequest');

  describe('POST /api/auth/login', () => {
    it('should return 400 if email/password missing', async () => {
      const res = await withCsrf(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@test.com' })
      );

      expect(res.status).toBe(400);
      // Zod schema validation now catches this before the controller
      expect(res.body.message).toContain('Validation failed');
    });

    it('should return 401 for invalid credentials', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await withCsrf(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'wrong@test.com', password: 'wrongpass' })
      );

      expect(res.status).toBe(401);
    });

    it('should return 200 with token on successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        password: await bcrypt.hash('password123', 10),
        roleId: 1,
        isActive: true,
        role: { name: 'admin' },
        employee: { 
          id: 1, 
          firstName: 'Admin', 
          lastName: 'User', 
          employeeId: 'EMP-001', 
          position: 'Admin' 
        },
        // Sequelize model instances have get() method
        get: jest.fn((key?: string) => {
          if (key === 'role') return { name: 'admin' };
          if (key === 'employee') return { id: 1, firstName: 'Admin', lastName: 'User', employeeId: 'EMP-001', position: 'Admin' };
          return undefined;
        }),
        update: jest.fn(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await withCsrf(
        request(app)
          .post('/api/auth/login')
          // Password sent as plain text — Zod validates it, controller hashes comparison
          .send({ email: 'admin@test.com', password: 'password123' })
      );

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should return 403 for deactivated account', async () => {
      const mockUser = {
        id: 2,
        email: 'inactive@test.com',
        password: await bcrypt.hash('password123', 10),
        roleId: 3,
        isActive: false,
        role: { name: 'employee' },
        get: jest.fn(),
        toJSON: jest.fn().mockReturnThis(),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await withCsrf(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'inactive@test.com', password: 'password123' })
      );

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email missing', async () => {
      const res = await withCsrf(
        request(app)
          .post('/api/auth/forgot-password')
          .send({})
      );

      expect(res.status).toBe(400);
    });

    it('should return success message even if email not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await withCsrf(
        request(app)
          .post('/api/auth/forgot-password')
          .send({ email: 'nonexistent@test.com' })
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If the email exists');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if token/password missing', async () => {
      const res = await withCsrf(
        request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'some-token' })
      );

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid/expired token', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const res = await withCsrf(
        request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'invalid-token', password: 'newpassword123' })
      );

      expect(res.status).toBe(400);
    });
  });
});
