import { Response } from 'express';
import { LeaveType, LeaveBalance, Employee, User, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheGet, cacheSet, cacheDelete } from '../utils/cache';
import { emitToUsers } from '../utils/socketEmitter';
import { logger } from '../utils/logger';

// GET /api/leave-types
export const getLeaveTypes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cached = cacheGet<any[]>('leave_types');
    if (cached) {
      res.json(cached);
      return;
    }
    const leaveTypes = await LeaveType.findAll({
      order: [['name', 'ASC']],
    });
    cacheSet('leave_types', leaveTypes, 600); // 10 min TTL
    res.json(leaveTypes);
  } catch (error) {
    logger.error('Get leave types error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave types.' });
  }
};

// POST /api/leave-types
export const createLeaveType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, defaultDays, color } = req.body;

    if (!name || defaultDays === undefined) {
      res.status(400).json({ message: 'Name and defaultDays are required.' });
      return;
    }

    const existing = await LeaveType.findOne({ where: { name } });
    if (existing) {
      res.status(400).json({ message: 'Leave type already exists.' });
      return;
    }

    const leaveType = await LeaveType.create({
      name,
      description: description || '',
      defaultDays,
      color: color || '#5B5FEF',
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'leave_type',
      entityId: leaveType.id,
      details: `Created leave type "${name}" with ${defaultDays} default days`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Create leave balances for all existing employees
    const employees = await Employee.findAll({
      include: [{ model: User, as: 'user', attributes: ['id'] }],
    });
    const currentYear = new Date().getFullYear();
    const balanceData = employees.map((emp) => ({
      employeeId: emp.id,
      leaveTypeId: leaveType.id,
      allocated: defaultDays,
      used: 0,
      remaining: defaultDays,
      year: currentYear,
    }));

    if (balanceData.length > 0) {
      await LeaveBalance.bulkCreate(balanceData);

      const userIds = employees
        .map((emp) => (emp.get('user') as { id: number } | undefined)?.id)
        .filter((id): id is number => id !== undefined);

      if (userIds.length > 0) {
        emitToUsers(req, userIds, {
          title: 'New Leave Type Available',
          message: `${name} (${defaultDays} days) has been added to your leave balances.`,
          type: 'info',
          link: '/apply-leave',
        });
      }

      await AuditLog.create({
        userId: req.user!.userId,
        action: 'create_balances',
        entity: 'leave_balance',
        entityId: leaveType.id,
        details: `Created ${name} balances for ${balanceData.length} employees`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

      cacheDelete('leave_types');
    res.status(201).json(leaveType);
  } catch (error) {
    logger.error('Create leave type error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create leave type.' });
  }
};

// PUT /api/leave-types/:id
export const updateLeaveType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveType = await LeaveType.findByPk(req.params.id);
    if (!leaveType) {
      res.status(404).json({ message: 'Leave type not found.' });
      return;
    }

    const { name, description, defaultDays, color } = req.body;
    const oldDefaultDays = leaveType.defaultDays;

    await leaveType.update({
      name: name || leaveType.name,
      description: description !== undefined ? description : leaveType.description,
      defaultDays: defaultDays !== undefined ? defaultDays : leaveType.defaultDays,
      color: color || leaveType.color,
    });

    // Sync all current-year employee balances when defaultDays changes
    if (defaultDays !== undefined && defaultDays !== oldDefaultDays) {
      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalance.findAll({
        where: { leaveTypeId: leaveType.id, year: currentYear },
      });

      let updatedCount = 0;
      for (const balance of balances) {
        const remaining = Math.max(defaultDays - Number(balance.used), 0);
        await balance.update({ allocated: defaultDays, remaining });
        updatedCount++;
      }

      logger.info(`Synced ${updatedCount} employee balances for leave type "${leaveType.name}" from ${oldDefaultDays} to ${defaultDays} days`);

      await AuditLog.create({
        userId: req.user!.userId,
        action: 'sync',
        entity: 'leave_balance',
        entityId: leaveType.id,
        details: `Synced employee balances for leave type "${leaveType.name}" from ${oldDefaultDays} to ${defaultDays} days (${updatedCount} records)`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'update',
      entity: 'leave_type',
      entityId: leaveType.id,
      details: `Updated leave type "${leaveType.name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete('leave_types');
    res.json(leaveType);
  } catch (error) {
    logger.error('Update leave type error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update leave type.' });
  }
};

// DELETE /api/leave-types/:id
export const deleteLeaveType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveType = await LeaveType.findByPk(req.params.id);
    if (!leaveType) {
      res.status(404).json({ message: 'Leave type not found.' });
      return;
    }

    const name = leaveType.name;
    await leaveType.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'leave_type',
      entityId: parseInt(req.params.id),
      details: `Deleted leave type "${name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete('leave_types');
    res.json({ message: 'Leave type deleted successfully.' });
  } catch (error) {
    logger.error('Delete leave type error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete leave type.' });
  }
};
