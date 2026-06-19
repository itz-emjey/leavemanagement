import { Response } from 'express';
import { Op } from 'sequelize';
import { LeaveBalance, LeaveType, Employee, Department, AuditLog, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { emitToUser } from '../utils/socketEmitter';

// GET /api/leave-credits
export const getLeaveCredits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const departmentId = req.query.departmentId as string;

    const employeeWhere: any = { deletedAt: null };
    if (departmentId) employeeWhere.departmentId = parseInt(departmentId);

    const credits = await LeaveBalance.findAll({
      where: { year },
      include: [
        {
          model: Employee, as: 'employee',
          where: employeeWhere,
          include: [{ model: Department, as: 'department', attributes: ['name'] }],
        },
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
      ],
      order: [[{ model: Employee, as: 'employee' }, 'firstName', 'ASC']],
    });

    res.json({ credits });
  } catch (error) {
    logger.error('Get leave credits error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave credits.' });
  }
};

// POST /api/leave-credits/adjust
export const adjustLeaveCredit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, leaveTypeId, year, allocated, reason } = req.body;

    if (!employeeId || !leaveTypeId || !year || allocated === undefined) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    let balance = await LeaveBalance.findOne({
      where: { employeeId, leaveTypeId, year },
    });

    if (balance) {
      const diff = Number(allocated) - Number(balance.allocated);
      await balance.update({
        allocated,
        remaining: Number(balance.remaining) + diff,
      });
    } else {
      balance = await LeaveBalance.create({
        employeeId,
        leaveTypeId,
        year,
        allocated,
        used: 0,
        remaining: allocated,
      });
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'adjust',
      entity: 'leave_credit',
      entityId: balance.id,
      details: `Adjusted leave credit for employee #${employeeId}, leave type #${leaveTypeId}, year ${year}: ${allocated} days`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Socket.IO notify the employee about balance change
    const employee = await Employee.findByPk(employeeId, { include: [{ model: User, as: 'user' }] });
    const empUser = employee?.get('user') as { id: number } | undefined;
    if (empUser?.id) {
      const leaveType = await LeaveType.findByPk(leaveTypeId);
      emitToUser(req, empUser.id, {
        title: 'Leave Balance Updated',
        message: `Your ${leaveType?.name || 'leave'} balance has been adjusted to ${allocated} days.`,
        type: 'balance_adjusted',
        link: '/leave-credits',
      });
    }

    res.json({ message: 'Leave credit adjusted successfully.', balance });
  } catch (error) {
    logger.error('Adjust credit error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to adjust leave credit.' });
  }
};

// POST /api/leave-credits/bulk-adjust
export const bulkAdjustLeaveCredits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeIds, leaveTypeId, year, allocated } = req.body;

    if (!employeeIds || !leaveTypeId || !year || allocated === undefined) {
      res.status(400).json({ message: 'Missing required fields: employeeIds, leaveTypeId, year, allocated' });
      return;
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      res.status(400).json({ message: 'employeeIds must be a non-empty array.' });
      return;
    }

    let updatedCount = 0;
    const results: { employeeId: number; success: boolean; message: string }[] = [];

    for (const employeeId of employeeIds) {
      try {
        let balance = await LeaveBalance.findOne({
          where: { employeeId: Number(employeeId), leaveTypeId: Number(leaveTypeId), year: Number(year) },
        });

        if (balance) {
          const diff = Number(allocated) - Number(balance.allocated);
          await balance.update({
            allocated: Number(allocated),
            remaining: Number(balance.remaining) + diff,
          });
        } else {
          balance = await LeaveBalance.create({
            employeeId: Number(employeeId),
            leaveTypeId: Number(leaveTypeId),
            year: Number(year),
            allocated: Number(allocated),
            used: 0,
            remaining: Number(allocated),
          });
        }

        updatedCount++;
        results.push({ employeeId: Number(employeeId), success: true, message: 'Updated' });

        // Socket.IO notify each employee
        const employee = await Employee.findByPk(Number(employeeId), { include: [{ model: User, as: 'user' }] });
        const empUser = employee?.get('user') as { id: number } | undefined;
        if (empUser?.id) {
          const leaveType = await LeaveType.findByPk(Number(leaveTypeId));
          emitToUser(req, empUser.id, {
            title: 'Leave Balance Updated',
            message: `Your ${leaveType?.name || 'leave'} balance has been adjusted to ${allocated} days.`,
            type: 'balance_adjusted',
            link: '/leave-credits',
          });
        }
      } catch (err: any) {
        results.push({ employeeId: Number(employeeId), success: false, message: err.message });
      }
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'bulk_adjust',
      entity: 'leave_credit',
      details: `Bulk adjusted leave credits for ${updatedCount}/${employeeIds.length} employees. Leave type #${leaveTypeId}, Year ${year}: ${allocated} days.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: `Adjusted leave credits for ${updatedCount} out of ${employeeIds.length} employees.`,
      updatedCount,
      totalCount: employeeIds.length,
      results,
    });
  } catch (error) {
    logger.error('Bulk adjust credits error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to bulk adjust leave credits.' });
  }
};

// POST /api/leave-credits/carry-over
export const carryOverCredits = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const currentBalances = await LeaveBalance.findAll({
      where: { year: currentYear },
      include: [{ model: LeaveType, as: 'leaveType' }],
    });

    let carried = 0;
    for (const bal of currentBalances) {
      const remaining = Number(bal.remaining);
      if (remaining > 0) {
        const existing = await LeaveBalance.findOne({
          where: {
            employeeId: bal.employeeId,
            leaveTypeId: bal.leaveTypeId,
            year: nextYear,
          },
        });

        if (existing) {
          await existing.update({
            allocated: existing.allocated + remaining,
            remaining: existing.remaining + remaining,
          });
        } else {
          const balLeaveType = bal.get('leaveType') as { defaultDays: number } | undefined;
          const defaultDays = balLeaveType?.defaultDays || 0;
          await LeaveBalance.create({
            employeeId: bal.employeeId,
            leaveTypeId: bal.leaveTypeId,
            year: nextYear,
            allocated: defaultDays + remaining,
            used: 0,
            remaining: remaining,
          });
        }
        carried++;
      }
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'carry_over',
      entity: 'leave_credit',
      details: `Carried over ${carried} balances from ${currentYear} to ${nextYear}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: `Carried over ${carried} balances to ${nextYear}.` });
  } catch (error) {
    logger.error('Carry over error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to carry over credits.' });
  }
};
