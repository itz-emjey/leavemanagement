import { Response } from 'express';
import { Op } from 'sequelize';
import { LeaveRequest, LeaveType, Employee } from '../models';
import { AuthRequest } from '../middleware/auth';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { generateICS } from '../utils/icalGenerator';
import { logger } from '../utils/logger';

/**
 * Safely resolve the authenticated user from either the Authorization header
 * (via protect middleware) or a ?token= query param (for window.open / webcal).
 */
function resolveAuthUser(req: AuthRequest): TokenPayload | null {
  if (req.user) return req.user;
  const tokenParam = req.query.token as string;
  if (tokenParam) {
    try {
      return verifyToken(tokenParam);
    } catch {
      return null;
    }
  }
  return null;
}

// GET /api/calendar/export
// Exports all approved leaves as an ICS file for the current user (or all for admin)
export const exportCalendarICS = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = resolveAuthUser(req);
    if (!user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    const { year, employeeId, team } = req.query;
    const targetYear = parseInt(year as string) || new Date().getFullYear();

    const where: any = {
      status: { [Op.in]: ['approved', 'pending'] },
      startDate: {
        [Op.gte]: targetYear + '-01-01',
        [Op.lte]: targetYear + '-12-31',
      },
    };

    // If not admin and not requesting team view, limit to own leaves
    if (user.role !== 'admin' && team !== 'true') {
      const emp = await Employee.findOne({ where: { userId: user.userId } });
      if (emp) where.employeeId = emp.id;
    } else if (employeeId && user.role === 'admin') {
      where.employeeId = parseInt(employeeId as string);
    }

    const leaves = await LeaveRequest.findAll({
      where,
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
        { model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeId'] },
      ],
      order: [['startDate', 'ASC']],
    });

    const events = leaves.map((lr: any) => {
      // UID: leave-{id}@leavems
      const uid = 'leave-' + lr.id + '@leavems.calendar';

      // End date is exclusive per RFC 5545: day after last day
      const endDate = new Date(lr.endDate);
      endDate.setDate(endDate.getDate() + 1);

      const endStr = endDate.getFullYear()
        + String(endDate.getMonth() + 1).padStart(2, '0')
        + String(endDate.getDate()).padStart(2, '0');

      const startStr = lr.startDate.replace(/-/g, '');

      const employeeName = lr.employee
        ? lr.employee.firstName + ' ' + lr.employee.lastName
        : 'Unknown';
      const leaveTypeName = lr.leaveType?.name || 'Leave';

      return {
        uid,
        summary: employeeName + ' - ' + leaveTypeName,
        description: 'Leave Type: ' + leaveTypeName + '\\n'
          + 'Status: ' + lr.status + '\\n'
          + 'Duration: ' + lr.duration + ' day' + (lr.duration !== 1 ? 's' : '')
          + (lr.reason ? '\\nReason: ' + lr.reason : '')
          + '\\n\\nExported from Leave Management System',
        location: lr.employee?.employeeId || '',
        dtStart: startStr,
        dtEnd: endStr,
        status: lr.status,
      };
    });

    const icsContent = generateICS({
      events,
      calendarName: 'Leave Management - ' + targetYear,
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leaves-' + targetYear + '.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(icsContent);
  } catch (error) {
    logger.error('Calendar export error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to export calendar.' });
  }
};

// GET /api/calendar/webcal
// Returns ICS content for live subscription (webcal:// protocol)
export const webcalSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = resolveAuthUser(req);
    if (!user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    // For webcal, export all approved leaves for the current year and next year
    const currentYear = new Date().getFullYear();

    const leaves = await LeaveRequest.findAll({
      where: {
        status: { [Op.in]: ['approved', 'pending'] },
        startDate: {
          [Op.gte]: currentYear + '-01-01',
          [Op.lte]: (currentYear + 1) + '-12-31',
        },
      },
      include: [
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
        { model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeId', 'departmentId'] },
      ],
      order: [['startDate', 'ASC']],
    });

    const events = leaves.map((lr: any) => {
      const uid = 'leave-' + lr.id + '@leavems.subscription';

      const endDate = new Date(lr.endDate);
      endDate.setDate(endDate.getDate() + 1);

      const endStr = endDate.getFullYear()
        + String(endDate.getMonth() + 1).padStart(2, '0')
        + String(endDate.getDate()).padStart(2, '0');

      const startStr = lr.startDate.replace(/-/g, '');

      const employeeName = lr.employee
        ? lr.employee.firstName + ' ' + lr.employee.lastName
        : 'Unknown';
      const leaveTypeName = lr.leaveType?.name || 'Leave';

      return {
        uid,
        summary: employeeName + ' - ' + leaveTypeName,
        description: 'Leave Type: ' + leaveTypeName + '\\n'
          + 'Status: ' + lr.status + '\\n'
          + 'Duration: ' + lr.duration + ' day' + (lr.duration !== 1 ? 's' : '')
          + (lr.reason ? '\\nReason: ' + lr.reason : '')
          + '\\n\\nLive subscription from Leave Management System',
        dtStart: startStr,
        dtEnd: endStr,
        status: lr.status,
      };
    });

    const icsContent = generateICS({
      events,
      calendarName: 'Leave Management (Live)',
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(icsContent);
  } catch (error) {
    logger.error('Webcal subscription error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to generate calendar subscription.' });
  }
};
