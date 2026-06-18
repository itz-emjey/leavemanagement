import { Response } from 'express';
import { fn, col } from 'sequelize';
import { Department, Employee, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, cacheDelete, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

// GET /api/departments
export const getDepartments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await cacheWrap(
      CacheKeys.DEPARTMENTS,
      async () => {
        return await Department.findAll({
          order: [['name', 'ASC']],
          include: [{ model: Employee, as: 'employees', attributes: [] }],
          attributes: ['id', 'name', 'description', [fn('COUNT', col('employees.id')), 'employeeCount']],
          group: ['Department.id', 'Department.name', 'Department.description'],
          subQuery: false,
        });
      },
      600, // 10 min TTL
    );

    res.json(departments);
  } catch (error) {
    logger.error('Get departments error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch departments.' });
  }
};

// POST /api/departments
export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Department name is required.' });
      return;
    }

    const existing = await Department.findOne({ where: { name } });
    if (existing) {
      res.status(400).json({ message: 'Department already exists.' });
      return;
    }

    const department = await Department.create({
      name,
      description: description || '',
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'department',
      entityId: department.id,
      details: `Created department "${name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.DEPARTMENTS);

    res.status(201).json(department);
  } catch (error) {
    logger.error('Create department error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create department.' });
  }
};

// PUT /api/departments/:id
export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      res.status(404).json({ message: 'Department not found.' });
      return;
    }

    const { name, description } = req.body;
    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'update',
      entity: 'department',
      entityId: department.id,
      details: `Updated department "${department.name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.DEPARTMENTS);

    res.json(department);
  } catch (error) {
    logger.error('Update department error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update department.' });
  }
};

// DELETE /api/departments/:id
export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      res.status(404).json({ message: 'Department not found.' });
      return;
    }

    // Check if employees exist in this department
    const employeeCount = await Employee.count({ where: { departmentId: department.id } });
    if (employeeCount > 0) {
      res.status(400).json({
        message: `Cannot delete department "${department.name}" because it has ${employeeCount} employee(s) assigned. Please reassign them first.`,
      });
      return;
    }

    await department.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'department',
      entityId: parseInt(req.params.id),
      details: `Deleted department "${department.name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.DEPARTMENTS);

    res.json({ message: 'Department deleted successfully.' });
  } catch (error) {
    logger.error('Delete department error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete department.' });
  }
};
