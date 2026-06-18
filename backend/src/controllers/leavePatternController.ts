import { Response } from 'express';
import { Op } from 'sequelize';
import { LeavePattern, LeaveRequest, LeaveType, Employee, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, cacheDelete, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Format a Date as YYYY-MM-DD using local time methods to avoid UTC timezone drift. */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculate upcoming dates for a leave pattern within a date range.
 * All date math uses local-time methods for consistency.
 */
function calculatePatternDates(
  frequency: string,
  dayOfWeek: number,
  weekOfMonth: number | undefined,
  startDate: string,
  endDate: string | undefined,
  limit: number = 20
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = endDate
    ? new Date(endDate + 'T00:00:00')
    : new Date(start.getFullYear() + 2, 0, 0); // ~2 years ahead

  let current = new Date(start);
  let occurrenceIndex = 0;

  while (current <= end && dates.length < limit) {
    if (frequency === 'weekly' || frequency === 'biweekly') {
      // Advance to the next matching day of week
      while (current.getDay() !== dayOfWeek) {
        current.setDate(current.getDate() + 1);
      }

      if (current >= start) {
        occurrenceIndex++;
        // Weekly: take every occurrence. Biweekly: take every 2nd (odd indices).
        if (frequency === 'weekly' || occurrenceIndex % 2 === 1) {
          dates.push(formatLocalDate(current));
        }
      }
      current.setDate(current.getDate() + 7);
    } else if (frequency === 'monthly' && weekOfMonth) {
      // Find the nth occurrence of dayOfWeek in the current month
      const year = current.getFullYear();
      const month = current.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstOfMonth.getDay();

      let targetDate: number;
      if (dayOfWeek >= firstDayOfWeek) {
        targetDate = 1 + (dayOfWeek - firstDayOfWeek) + (weekOfMonth - 1) * 7;
      } else {
        targetDate = 1 + (7 - firstDayOfWeek + dayOfWeek) + (weekOfMonth - 1) * 7;
      }

      const lastDay = new Date(year, month + 1, 0).getDate();
      if (targetDate <= lastDay) {
        const candidate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDate).padStart(2, '0')}`;
        if (candidate >= startDate && (!endDate || candidate <= endDate)) {
          dates.push(candidate);
        }
      }

      // Move to next month
      current = new Date(year, month + 1, 1);
      continue;
    }
  }

  return dates;
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Every week',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

// GET /api/leave-patterns
export const getLeavePatterns = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let resolvedEmployeeId: number | undefined;
    const queryEmployeeId = req.query.employeeId as string;

    if (queryEmployeeId) {
      resolvedEmployeeId = parseInt(queryEmployeeId);
    }

    // Employees only see their own patterns
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ where: { userId: req.user.userId } });
      if (emp) resolvedEmployeeId = emp.id;
    }

    const cacheKey = CacheKeys.LEAVE_PATTERNS(resolvedEmployeeId);

    const result = await cacheWrap(
      cacheKey,
      async () => {
        const where: any = {};
        if (resolvedEmployeeId) where.employeeId = resolvedEmployeeId;

        const patterns = await LeavePattern.findAll({
          where,
          include: [
            { model: Employee, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
            { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'] },
          ],
          order: [['createdAt', 'DESC']],
        });

        // Enrich with upcoming dates preview
        return {
          patterns: patterns.map((p) => {
            const upcomingDates = calculatePatternDates(
              p.frequency, p.dayOfWeek, p.weekOfMonth,
              p.startDate, p.endDate || undefined, 5
            );
            return {
              ...p.toJSON(),
              upcomingDates,
              frequencyLabel: frequencyLabels[p.frequency] || p.frequency,
              dayLabel: DAY_NAMES[p.dayOfWeek],
            };
          }),
        };
      },
      300, // 5 min TTL
    );

    res.json(result);
  } catch (error) {
    logger.error('Get leave patterns error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave patterns.' });
  }
};

// GET /api/leave-patterns/preview
export const previewDates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { frequency, dayOfWeek, weekOfMonth, startDate, endDate } = req.query;

    if (!frequency || dayOfWeek === undefined || !startDate) {
      res.status(400).json({ message: 'frequency, dayOfWeek, and startDate are required.' });
      return;
    }

    const dates = calculatePatternDates(
      frequency as string,
      parseInt(dayOfWeek as string),
      weekOfMonth ? parseInt(weekOfMonth as string) : undefined,
      startDate as string,
      endDate as string | undefined,
      20
    );

    res.json({ dates });
  } catch (error) {
    logger.error('Preview dates error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to preview dates.' });
  }
};

// POST /api/leave-patterns
export const createLeavePattern = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveTypeId, frequency, dayOfWeek, weekOfMonth, startDate, endDate, reason } = req.body;

    if (!leaveTypeId || !frequency || dayOfWeek === undefined || !startDate) {
      res.status(400).json({ message: 'leaveTypeId, frequency, dayOfWeek, and startDate are required.' });
      return;
    }

    // Get employee ID from current user for non-admin
    let employeeId = req.body.employeeId;
    if (!employeeId || req.user?.role === 'employee') {
      const emp = await Employee.findOne({ where: { userId: req.user!.userId } });
      if (!emp) {
        res.status(404).json({ message: 'Employee not found.' });
        return;
      }
      employeeId = emp.id;
    }

    const pattern = await LeavePattern.create({
      employeeId: parseInt(employeeId),
      leaveTypeId: parseInt(leaveTypeId),
      frequency,
      dayOfWeek: parseInt(dayOfWeek),
      weekOfMonth: weekOfMonth ? parseInt(weekOfMonth) : undefined,
      startDate,
      endDate: endDate || undefined,
      reason,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'leave_pattern',
      entityId: pattern.id,
      details: `Created ${frequency} leave pattern starting ${startDate}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Calculate preview dates
    const upcomingDates = calculatePatternDates(frequency, parseInt(dayOfWeek), weekOfMonth ? parseInt(weekOfMonth) : undefined, startDate, endDate, 5);

    // Invalidate pattern cache
    cacheDelete(CacheKeys.LEAVE_PATTERNS(parseInt(employeeId)));

    res.status(201).json({
      message: 'Leave pattern created successfully.',
      pattern: { ...pattern.toJSON(), upcomingDates, frequencyLabel: frequencyLabels[frequency], dayLabel: DAY_NAMES[parseInt(dayOfWeek)] },
    });
  } catch (error) {
    logger.error('Create leave pattern error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create leave pattern.' });
  }
};

// POST /api/leave-patterns/:id/generate
export const generateFromPattern = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pattern = await LeavePattern.findByPk(req.params.id);
    if (!pattern) {
      res.status(404).json({ message: 'Leave pattern not found.' });
      return;
    }

    if (pattern.status !== 'active') {
      res.status(400).json({ message: 'Cannot generate from a non-active pattern.' });
      return;
    }

    const { months = 3, overrideExisting = false } = req.body;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(months));

    const dates = calculatePatternDates(
      pattern.frequency, pattern.dayOfWeek, pattern.weekOfMonth || undefined,
      pattern.startDate, pattern.endDate || formatLocalDate(endDate),
      50
    );

    let created = 0;
    let skipped = 0;

    for (const date of dates) {
      // Check if a leave request already exists for this employee on this date
      if (!overrideExisting) {
        const existing = await LeaveRequest.findOne({
          where: {
            employeeId: pattern.employeeId,
            startDate: { [Op.lte]: date },
            endDate: { [Op.gte]: date },
            status: { [Op.in]: ['pending', 'approved'] },
          },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      await LeaveRequest.create({
        employeeId: pattern.employeeId,
        leaveTypeId: pattern.leaveTypeId,
        startDate: date,
        endDate: date,
        duration: 1,
        reason: pattern.reason || `Recurring leave (${frequencyLabels[pattern.frequency]})`,
        status: 'pending',
      });
      created++;
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'generate',
      entity: 'leave_pattern',
      entityId: pattern.id,
      details: `Generated ${created} leave requests from pattern #${pattern.id} (${skipped} skipped)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Invalidate all relevant caches
    cacheDelete(CacheKeys.LEAVE_PATTERNS(pattern.employeeId));
    cacheDelete(CacheKeys.DASHBOARD_ADMIN);
    cacheDelete(CacheKeys.DASHBOARD_EMPLOYEE(pattern.employeeId));
    cacheDelete(CacheKeys.ANALYTICS_OVERVIEW(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_TRENDS(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_EMPLOYEES(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_UTILIZATION(new Date().getFullYear()));

    res.json({
      message: `Generated ${created} leave requests from pattern.`,
      created,
      skipped,
      totalDates: dates.length,
    });
  } catch (error) {
    logger.error('Generate from pattern error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to generate leave requests.' });
  }
};

// PATCH /api/leave-patterns/:id
export const updateLeavePattern = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pattern = await LeavePattern.findByPk(req.params.id);
    if (!pattern) {
      res.status(404).json({ message: 'Leave pattern not found.' });
      return;
    }

    const { frequency, dayOfWeek, weekOfMonth, startDate, endDate, status, reason } = req.body;
    await pattern.update({
      frequency: frequency || pattern.frequency,
      dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : pattern.dayOfWeek,
      weekOfMonth: weekOfMonth !== undefined ? weekOfMonth : pattern.weekOfMonth,
      startDate: startDate || pattern.startDate,
      endDate: endDate !== undefined ? (endDate || null) : pattern.endDate,
      status: status || pattern.status,
      reason: reason !== undefined ? reason : pattern.reason,
    });

    cacheDelete(CacheKeys.LEAVE_PATTERNS(pattern.employeeId));

    res.json({ message: 'Leave pattern updated.', pattern });
  } catch (error) {
    logger.error('Update leave pattern error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update leave pattern.' });
  }
};

// DELETE /api/leave-patterns/:id
export const deleteLeavePattern = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pattern = await LeavePattern.findByPk(req.params.id);
    if (!pattern) {
      res.status(404).json({ message: 'Leave pattern not found.' });
      return;
    }

    const employeeId = pattern.employeeId;
    await pattern.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'leave_pattern',
      entityId: parseInt(req.params.id),
      details: `Deleted leave pattern #${req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    cacheDelete(CacheKeys.LEAVE_PATTERNS(employeeId));

    res.json({ message: 'Leave pattern deleted.' });
  } catch (error) {
    logger.error('Delete leave pattern error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete leave pattern.' });
  }
};
