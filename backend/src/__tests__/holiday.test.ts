import request from 'supertest';
import app from '../app';
import { Holiday, AuditLog } from '../models';

jest.mock('../models', () => ({
  Holiday: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  AuditLog: {
    create: jest.fn(),
  },
}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(() => ({ userId: 1, email: 'admin@test.com', roleId: 1, role: 'admin' })),
}));

// Use the same pattern as other tests: skip csrfProtection mock, add header per-request
jest.mock('../middleware/auth', () => ({
  ...jest.requireActual('../middleware/auth'),
  protect: (req: any, _res: any, next: any) => {
    req.user = { userId: 1, email: 'admin@test.com', roleId: 1, role: 'admin' };
    next();
  },
}));

describe('Holiday Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/holidays', () => {
    it('should return holidays', async () => {
      (Holiday.findAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Christmas', date: '2025-12-25', isRecurring: true, type: 'public' },
      ]);

      const res = await request(app)
        .get('/api/holidays')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/holidays', () => {
    it('should return 400 if name/date missing', async () => {
      const res = await request(app)
        .post('/api/holidays')
        .send({ name: 'Christmas' })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(400);
    });

    it('should create holiday', async () => {
      (Holiday.findOne as jest.Mock).mockResolvedValue(null);
      (Holiday.create as jest.Mock).mockResolvedValue({ id: 1, name: 'New Year', date: '2025-01-01' });

      const res = await request(app)
        .post('/api/holidays')
        .send({ name: 'New Year', date: '2025-01-01' })
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /api/holidays/:id', () => {
    it('should return 404 for non-existent holiday', async () => {
      (Holiday.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/holidays/999')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(404);
    });

    it('should delete holiday', async () => {
      const mockHoliday = { id: 1, name: 'Test Holiday', destroy: jest.fn() };
      (Holiday.findByPk as jest.Mock).mockResolvedValue(mockHoliday);

      const res = await request(app)
        .delete('/api/holidays/1')
        .set('X-Requested-With', 'XMLHttpRequest');

      expect(res.status).toBe(200);
      expect(mockHoliday.destroy).toHaveBeenCalled();
    });
  });
});
