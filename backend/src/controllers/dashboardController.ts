import { Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { Employee, LeaveRequest, LeaveType, Department, User, AuditLog, LeaveBalance } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, cacheDelete, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

// Types for raw query results
interface MonthlyTrendRow {
  month: number;
  count: number;
  status: string;
}

interface LeaveTypeDistributionRow {
  'leaveType.name': string;
  'leaveType.color': string;
  totalDays: number;
}

// GET /api/dashboard/employee
export const getEmployeeDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee profile not found.' });
      return;
    }

    const currentYear = new Date().getFullYear();

    // KPI Data
    const pendingLeaves = await LeaveRequest.count({
      where: { employeeId: employee.id, status: 'pending' },
    });
    const approvedLeaves = await LeaveRequest.count({
      where: { employeeId: employee.id, status: 'approved' },
    });
    const rejectedLeaves = await LeaveRequest.count({
      where: { employeeId: employee.id, status: 'rejected' },
    });

    const today = new Date().toISOString().split('T')[0];
    const onLeave = await LeaveRequest.count({
      where: {
        employeeId: employee.id,
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today },
      },
    });

    // Leave balances
    const leaveBalances = await LeaveBalance.findAll({
      where: { employeeId: employee.id, year: currentYear },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
    });

    const balances = leaveBalances.map((lb) => {
      const lt = lb.get('leaveType') as { name: string; color: string } | undefined;
      return {
        leaveTypeId: lb.leaveTypeId,
        leaveType: lt?.name || 'Unknown',
        color: lt?.color || '#3B82F6',
        allocated: Number(lb.allocated),
        used: Number(lb.used),
        remaining: Number(lb.remaining),
      };
    });

    // Calendar Events (my leaves)
    const calendarLeaves = await LeaveRequest.findAll({
      where: {
        employeeId: employee.id,
        status: { [Op.in]: ['approved', 'pending'] },
        startDate: {
          [Op.gte]: `${currentYear}-01-01`,
          [Op.lte]: `${currentYear}-12-31`,
        },
      },
      attributes: ['id', 'startDate', 'endDate', 'status', 'duration'],
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      order: [['startDate', 'ASC']],
    });

    const calendarEvents = calendarLeaves.map((lr) => {
      const lt = lr.get('leaveType') as { name: string; color: string } | undefined;
      return {
        id: String(lr.id),
        title: `${lt?.name || 'Leave'}${lr.status === 'pending' ? ' (Pending)' : ''}`,
        start: lr.startDate,
        end: lr.endDate,
        backgroundColor: lr.status === 'approved' ? lt?.color || '#3B82F6' : '#F59E0B',
        borderColor: lr.status === 'approved' ? lt?.color || '#3B82F6' : '#F59E0B',
        textColor: '#FFFFFF',
        extendedProps: { status: lr.status, leaveType: lt?.name || '' },
      };
    });

    // Recent my requests
    const recentRequests = await LeaveRequest.findAll({
      where: { employeeId: employee.id },
      attributes: ['id', 'startDate', 'endDate', 'duration', 'status', 'createdAt'],
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    // Upcoming approved leave (next leave with countdown)
    const nextUpcomingLeave = await LeaveRequest.findOne({
      where: {
        employeeId: employee.id,
        status: 'approved',
        startDate: { [Op.gte]: today },
      },
      attributes: ['id', 'startDate', 'endDate', 'duration'],
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      order: [['startDate', 'ASC']],
    });

    const nextUpcomingLeaveData = nextUpcomingLeave
      ? {
          id: nextUpcomingLeave.id,
          leaveType: (nextUpcomingLeave.get('leaveType') as { name?: string })?.name || null,
          leaveTypeColor: (nextUpcomingLeave.get('leaveType') as { color?: string })?.color || null,
          startDate: nextUpcomingLeave.startDate,
          endDate: nextUpcomingLeave.endDate,
          duration: nextUpcomingLeave.duration,
        }
      : null;

    res.json({
      kpis: {
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        onLeave,
        totalBalances: balances.reduce((sum, b) => sum + Number(b.remaining), 0),
      },
      balances,
      calendarEvents,
      recentRequests: recentRequests.map((lr) => ({
        id: lr.id,
        leaveType: (lr.get('leaveType') as { name?: string })?.name || null,
        leaveTypeColor: (lr.get('leaveType') as { color?: string })?.color || null,
        startDate: lr.startDate,
        endDate: lr.endDate,
        duration: lr.duration,
        status: lr.status,
        createdAt: lr.createdAt,
      })),
      nextUpcomingLeave: nextUpcomingLeaveData,
    });
  } catch (error) {
    logger.error('Employee Dashboard error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
};

// GET /api/dashboard/admin
export const getAdminDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();

    const data = await cacheWrap(
      CacheKeys.DASHBOARD_ADMIN,
      async () => {
        const totalEmployees = await Employee.count({ where: { deletedAt: null as null } as Record<string, unknown> });
        const activeEmployees = await Employee.count({
          where: { deletedAt: null as null } as Record<string, unknown>,
          include: [{ model: User, as: 'user', where: { isActive: true }, required: true }],
        });
        const pendingLeaves = await LeaveRequest.count({ where: { status: 'pending' } });
        const approvedLeaves = await LeaveRequest.count({ where: { status: 'approved' } });
        const rejectedLeaves = await LeaveRequest.count({ where: { status: 'rejected' } });

        const today = new Date().toISOString().split('T')[0];
        const onLeave = await LeaveRequest.count({
          where: {
            status: 'approved',
            startDate: { [Op.lte]: today },
            endDate: { [Op.gte]: today },
          },
        });

        const yearStart = new Date(`${currentYear}-01-01`);
        const yearEnd = new Date(`${currentYear}-12-31`);

        // Calendar Events
        const calendarLeaves = await LeaveRequest.findAll({
          where: {
            status: { [Op.in]: ['approved', 'pending'] },
            startDate: {
              [Op.gte]: `${currentYear}-01-01`,
              [Op.lte]: `${currentYear}-12-31`,
            },
          },
          attributes: ['id', 'startDate', 'endDate', 'status', 'duration'],
          include: [
            { model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeId'] },
            { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
          ],
          order: [['startDate', 'ASC']],
        });

        const calendarEvents = calendarLeaves.map((lr) => {
          const emp = lr.get('employee') as { firstName: string; lastName: string } | undefined;
          const lt = lr.get('leaveType') as { name: string; color: string } | undefined;
          return {
            id: String(lr.id),
            title: `${emp?.firstName || ''} ${emp?.lastName || ''} - ${lt?.name || 'Leave'}`,
            start: lr.startDate,
            end: lr.endDate,
            backgroundColor: lr.status === 'approved' ? lt?.color || '#3B82F6' : '#F59E0B',
            borderColor: lr.status === 'approved' ? lt?.color || '#3B82F6' : '#F59E0B',
            textColor: '#FFFFFF',
            extendedProps: {
              status: lr.status,
              employeeName: `${emp?.firstName || ''} ${emp?.lastName || ''}`,
              leaveType: lt?.name || '',
            },
          };
        });

        // Monthly Leave Trends
        const monthlyTrends = await LeaveRequest.findAll({
          where: {
            status: { [Op.in]: ['approved', 'rejected'] },
            createdAt: { [Op.gte]: yearStart, [Op.lte]: yearEnd } as unknown as undefined,
          } as Record<string, unknown>,
          attributes: [
            [fn('MONTH', col('startDate')), 'month'],
            [fn('COUNT', col('id')), 'count'],
            'status',
          ],
          group: [fn('MONTH', col('startDate')), 'status'],
          raw: true,
        }) as unknown as MonthlyTrendRow[];

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthNames.map((_name, i) => {
          const approved = monthlyTrends.find((r) => r.month === i + 1 && r.status === 'approved');
          const rejected = monthlyTrends.find((r) => r.month === i + 1 && r.status === 'rejected');
          return {
            month: monthNames[i],
            approved: approved ? Number(approved.count) : 0,
            rejected: rejected ? Number(rejected.count) : 0,
          };
        });

        // Leave Type Distribution
        const leaveTypeDistribution = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            createdAt: { [Op.gte]: yearStart, [Op.lte]: yearEnd } as unknown as undefined,
          } as Record<string, unknown>,
          include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
          attributes: [[fn('SUM', col('duration')), 'totalDays'], 'leaveTypeId'],
          group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
          raw: true,
        }) as unknown as LeaveTypeDistributionRow[];

        const leaveTypeData = leaveTypeDistribution.map((item) => ({
          name: item['leaveType.name'] || 'Unknown',
          value: Number(item.totalDays) || 0,
          color: item['leaveType.color'] || '#3B82F6',
        }));

        // Recent Activities
        const recentActivities = await AuditLog.findAll({
          include: [{ model: User, as: 'user', attributes: ['email'] }],
          order: [['createdAt', 'DESC']],
          limit: 10,
        });

        const activities = recentActivities.map((log) => {
          const user = log.get('user') as { email: string } | undefined;
          return {
            id: log.id,
            action: log.action,
            entity: log.entity,
            details: log.details,
            user: user?.email || 'System',
            createdAt: log.createdAt,
          };
        });

        // Recent Leave Requests
        const recentRequests = await LeaveRequest.findAll({
          include: [
            {
              model: Employee, as: 'employee',
              attributes: ['firstName', 'lastName', 'employeeId'],
              include: [{ model: Department, as: 'department', attributes: ['name'] }],
            },
            { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
          ],
          order: [['createdAt', 'DESC']],
          limit: 10,
        });

        const leaveRequests = recentRequests.map((lr) => {
          const emp = lr.get('employee') as { firstName: string; lastName: string; employeeId: string; department?: { name: string } } | undefined;
          const lt = lr.get('leaveType') as { name: string; color: string } | undefined;
          return {
            id: lr.id,
            employeeName: `${emp?.firstName || ''} ${emp?.lastName || ''}`,
            employeeId: emp?.employeeId || '',
            department: emp?.department?.name || '',
            leaveType: lt?.name || '',
            leaveTypeColor: lt?.color || '',
            startDate: lr.startDate,
            endDate: lr.endDate,
            duration: lr.duration,
            status: lr.status,
            createdAt: lr.createdAt,
          };
        });

        // Pending leaves
        const pendingForApproval = await LeaveRequest.findAll({
          where: { status: 'pending' },
          include: [
            {
              model: Employee, as: 'employee',
              attributes: ['id', 'firstName', 'lastName', 'employeeId'],
              include: [{ model: Department, as: 'department', attributes: ['name'] }],
            },
            { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
          ],
          order: [['createdAt', 'ASC']],
          limit: 5,
        });

        // Upcoming approved leaves
        const upcomingLeaves = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: today },
          },
          include: [
            {
              model: Employee, as: 'employee',
              attributes: ['firstName', 'lastName', 'employeeId'],
              include: [{ model: Department, as: 'department', attributes: ['name'] }],
            },
            { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
          ],
          order: [['startDate', 'ASC']],
          limit: 5,
        });

        const formatUpcomingLeave = (lr: any) => {
          const emp = lr.get('employee') as { firstName: string; lastName: string; employeeId: string; department?: { name: string } } | undefined;
          const lt = lr.get('leaveType') as { name: string; color: string } | undefined;
          return {
            id: lr.id,
            employeeName: `${emp?.firstName || ''} ${emp?.lastName || ''}`,
            employeeId: emp?.employeeId || '',
            department: emp?.department?.name || '',
            leaveType: lt?.name || '',
            leaveTypeColor: lt?.color || '',
            startDate: lr.startDate,
            endDate: lr.endDate,
            duration: lr.duration,
            reason: lr.reason,
            createdAt: lr.createdAt,
          };
        };

        return {
          kpis: { totalEmployees, activeEmployees, pendingLeaves, approvedLeaves, rejectedLeaves, onLeave },
          calendarEvents,
          monthlyTrends: monthlyData,
          leaveTypeDistribution: leaveTypeData,
          recentActivities: activities,
          recentRequests: leaveRequests,
          pendingForApproval: pendingForApproval.map(formatUpcomingLeave),
          upcomingLeaves: upcomingLeaves.map(formatUpcomingLeave),
        };
      },
      120, // 2 min TTL
    );

    res.json(data);
  } catch (error) {
    logger.error('Dashboard error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
};


