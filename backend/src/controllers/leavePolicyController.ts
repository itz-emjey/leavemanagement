import { Response } from 'express';
import { LeavePolicy, LeaveType, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, cacheDelete, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

// GET /api/leave-policies
export const getLeavePolicies = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policies = await cacheWrap(
      CacheKeys.LEAVE_POLICIES,
      async () => {
        return await LeavePolicy.findAll({
          include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color', 'defaultDays'] }],
          order: [[{ model: LeaveType, as: 'leaveType' }, 'name', 'ASC']],
        });
      },
      600, // 10 min TTL
    );

    res.json(policies);
  } catch (error) {
    logger.error('Get leave policies error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave policies.' });
  }
};

// GET /api/leave-policies/:id
export const getLeavePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await LeavePolicy.findByPk(req.params.id, {
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color', 'defaultDays'] }],
    });
    if (!policy) {
      res.status(404).json({ message: 'Leave policy not found.' });
      return;
    }
    res.json(policy);
  } catch (error) {
    logger.error('Get leave policy error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave policy.' });
  }
};

// POST /api/leave-policies
export const createLeavePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveTypeId, maxConsecutiveDays, minNoticeDays, carryOverLimit, requiresApproval, isActive } = req.body;

    if (!leaveTypeId) {
      res.status(400).json({ message: 'Leave type ID is required.' });
      return;
    }

    const existing = await LeavePolicy.findOne({ where: { leaveTypeId } });
    if (existing) {
      res.status(400).json({ message: 'A policy for this leave type already exists.' });
      return;
    }

    const policy = await LeavePolicy.create({
      leaveTypeId,
      maxConsecutiveDays: maxConsecutiveDays || 15,
      minNoticeDays: minNoticeDays || 1,
      carryOverLimit: carryOverLimit || 5,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      isActive: isActive !== undefined ? isActive : true,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'leave_policy',
      entityId: policy.id,
      details: `Created leave policy for leave type #${leaveTypeId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.LEAVE_POLICIES);

    const fullPolicy = await LeavePolicy.findByPk(policy.id, {
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color', 'defaultDays'] }],
    });

    res.status(201).json(fullPolicy);
  } catch (error) {
    logger.error('Create leave policy error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create leave policy.' });
  }
};

// PUT /api/leave-policies/:id
export const updateLeavePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await LeavePolicy.findByPk(req.params.id);
    if (!policy) {
      res.status(404).json({ message: 'Leave policy not found.' });
      return;
    }

    const { maxConsecutiveDays, minNoticeDays, carryOverLimit, requiresApproval, isActive } = req.body;

    await policy.update({
      maxConsecutiveDays: maxConsecutiveDays !== undefined ? maxConsecutiveDays : policy.maxConsecutiveDays,
      minNoticeDays: minNoticeDays !== undefined ? minNoticeDays : policy.minNoticeDays,
      carryOverLimit: carryOverLimit !== undefined ? carryOverLimit : policy.carryOverLimit,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : policy.requiresApproval,
      isActive: isActive !== undefined ? isActive : policy.isActive,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'update',
      entity: 'leave_policy',
      entityId: policy.id,
      details: `Updated leave policy for leave type #${policy.leaveTypeId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.LEAVE_POLICIES);

    const fullPolicy = await LeavePolicy.findByPk(policy.id, {
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color', 'defaultDays'] }],
    });

    res.json(fullPolicy);
  } catch (error) {
    logger.error('Update leave policy error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update leave policy.' });
  }
};

// DELETE /api/leave-policies/:id
export const deleteLeavePolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policy = await LeavePolicy.findByPk(req.params.id);
    if (!policy) {
      res.status(404).json({ message: 'Leave policy not found.' });
      return;
    }

    const leaveTypeId = policy.leaveTypeId;
    await policy.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'leave_policy',
      entityId: parseInt(req.params.id),
      details: `Deleted leave policy for leave type #${leaveTypeId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.LEAVE_POLICIES);

    res.json({ message: 'Leave policy deleted successfully.' });
  } catch (error) {
    logger.error('Delete leave policy error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete leave policy.' });
  }
};
