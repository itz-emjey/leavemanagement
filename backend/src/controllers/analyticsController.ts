import { Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { LeaveRequest, LeaveType, Department, Employee, LeaveBalance, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, CacheKeys, cacheDelete } from '../utils/cache';
import { logger } from '../utils/logger';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Types for raw query results
interface YearlySummaryRow {
  totalDays: number;
  avgDuration: number;
}

interface MonthBreakdownRow {
  month: number;
  totalDays: number;
  requestCount: number;
}

interface TrendRow {
  month: number;
  count: number;
  status: string;
}

interface LeaveTypeRow {
  'leaveType.name': string;
  'leaveType.color': string;
  totalDays: number;
}

interface EmployeeLeaveRow {
  'employee.id': number;
  'employee.employeeId': string;
  'employee.firstName': string;
  'employee.lastName': string;
  'employee.department.name': string;
  totalDays: number;
  requestCount: number;
  avgDuration: number;
}

interface UtilizationRow {
  'leaveType.name': string;
  'leaveType.color': string;
  totalAllocated: number;
  totalUsed: number;
}

interface DepartmentRow {
  name: string;
  totalDays: number;
  employeeCount: number;
}

interface DistinctEmployeeRow {
  employeeId: number;
}

// GET /api/analytics/overview
export const getAnalyticsOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();

    const data = await cacheWrap(
      CacheKeys.ANALYTICS_OVERVIEW(currentYear),
      async () => {
        const years = [currentYear - 2, currentYear - 1, currentYear];

        const yearlyData = await Promise.all(years.map(async (year) => {
          const totalRequests = await LeaveRequest.count({
            where: {
              startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
            },
          });
          const approvedRequests = await LeaveRequest.count({
            where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
          });
          const pendingRequests = await LeaveRequest.count({
            where: { status: 'pending', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
          });
          const rejectedRequests = await LeaveRequest.count({
            where: { status: 'rejected', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
          });

          const totalDaysResult = await LeaveRequest.findAll({
            where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
            attributes: [[fn('SUM', col('duration')), 'totalDays']],
            raw: true,
          }) as unknown as YearlySummaryRow[];
          const totalDays = Number(totalDaysResult[0]?.totalDays) || 0;
          const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

          const avgDurationResult = await LeaveRequest.findAll({
            where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
            attributes: [[fn('AVG', col('duration')), 'avgDuration']],
            raw: true,
          }) as unknown as YearlySummaryRow[];
          const avgDuration = Number(avgDurationResult[0]?.avgDuration) || 0;

          return {
            year,
            totalRequests,
            approvedRequests,
            pendingRequests,
            rejectedRequests,
            totalDays,
            approvalRate,
            avgDuration: Math.round(avgDuration * 10) / 10,
          };
        }));

        // Current year breakdown by month
        const monthBreakdown = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: `${currentYear}-01-01`, [Op.lte]: `${currentYear}-12-31` },
          },
          attributes: [
            [fn('MONTH', col('startDate')), 'month'],
            [fn('SUM', col('duration')), 'totalDays'],
            [fn('COUNT', col('id')), 'requestCount'],
          ],
          group: [fn('MONTH', col('startDate'))],
          raw: true,
        }) as unknown as MonthBreakdownRow[];

        const busyMonths = MONTH_NAMES.map((name, i) => {
          const data = monthBreakdown.find((r) => r.month === i + 1);
          return {
            month: name,
            totalDays: data ? Number(data.totalDays) : 0,
            requestCount: data ? Number(data.requestCount) : 0,
          };
        });

        // Top leave types by total days
        const topLeaveTypes = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: `${currentYear}-01-01`, [Op.lte]: `${currentYear}-12-31` },
          },
          include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
          attributes: [[fn('SUM', col('LeaveRequest.duration')), 'totalDays'], 'leaveTypeId'],
          group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
          order: [[literal('SUM(`LeaveRequest`.`duration`)'), 'DESC']],
          raw: true,
        }) as unknown as LeaveTypeRow[];

        const totalDaysAll = topLeaveTypes.reduce((sum, item) => sum + (Number(item.totalDays) || 0), 0);

        const leaveTypesAnalytics = topLeaveTypes.map((item) => ({
          name: item['leaveType.name'] || 'Unknown',
          color: item['leaveType.color'] || '#3B82F6',
          totalDays: Number(item.totalDays) || 0,
          percentage: totalDaysAll > 0 ? Math.round((Number(item.totalDays) / totalDaysAll) * 100) : 0,
        }));

        return {
          yearlyData,
          currentYear,
          busyMonths,
          topLeaveTypes: leaveTypesAnalytics,
        };
      },
      300, // 5 min TTL
    );

    res.json(data);
  } catch (error) {
    logger.error('Analytics overview error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load analytics overview.' });
  }
};

// GET /api/analytics/trends
export const getAnalyticsTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    const departmentId = req.query.departmentId as string;

    const data = await cacheWrap(
      CacheKeys.ANALYTICS_TRENDS(currentYear, departmentId),
      async () => {
        const years = [currentYear - 1, currentYear];

        const trendsData = await Promise.all(years.map(async (year) => {
          const where: Record<string, unknown> = {
            status: { [Op.in]: ['approved', 'rejected'] },
            startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
          };

          const employeeWhere: Record<string, unknown> = {};
          if (departmentId) employeeWhere.departmentId = parseInt(departmentId);

          const trends = await LeaveRequest.findAll({
            where,
            include: departmentId ? [
              { model: Employee, as: 'employee', where: employeeWhere, attributes: [] },
            ] : [],
            attributes: [
              [fn('MONTH', col('LeaveRequest.startDate')), 'month'],
              [fn('COUNT', col('LeaveRequest.id')), 'count'],
              'status',
            ],
            group: [fn('MONTH', col('LeaveRequest.startDate')), 'status'],
            raw: true,
          }) as unknown as TrendRow[];

          return {
            year,
            data: MONTH_NAMES.map((_name, i) => {
              const approved = trends.find((r) => r.month === i + 1 && r.status === 'approved');
              const rejected = trends.find((r) => r.month === i + 1 && r.status === 'rejected');
              return {
                month: MONTH_NAMES[i],
                approved: approved ? Number(approved.count) : 0,
                rejected: rejected ? Number(rejected.count) : 0,
              };
            }),
          };
        }));

        // Approval rate trend
        const approvalRateData = await LeaveRequest.findAll({
          where: {
            status: { [Op.in]: ['approved', 'rejected'] },
            startDate: { [Op.gte]: `${currentYear}-01-01`, [Op.lte]: `${currentYear}-12-31` },
          },
          attributes: [
            [fn('MONTH', col('startDate')), 'month'],
            [fn('COUNT', col('id')), 'count'],
            'status',
          ],
          group: [fn('MONTH', col('startDate')), 'status'],
          raw: true,
        }) as unknown as TrendRow[];

        const approvalRateTrend = MONTH_NAMES.map((_name, i) => {
          const approved = approvalRateData.find((r) => r.month === i + 1 && r.status === 'approved');
          const rejected = approvalRateData.find((r) => r.month === i + 1 && r.status === 'rejected');
          const approvedCount = approved ? Number(approved.count) : 0;
          const rejectedCount = rejected ? Number(rejected.count) : 0;
          const total = approvedCount + rejectedCount;
          return {
            month: MONTH_NAMES[i],
            approved: approvedCount,
            rejected: rejectedCount,
            approvalRate: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
          };
        });

        return {
          yearOverYear: trendsData,
          approvalRateTrend,
        };
      },
      300, // 5 min TTL
    );

    res.json(data);
  } catch (error) {
    logger.error('Analytics trends error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load analytics trends.' });
  }
};

// GET /api/analytics/employees
export const getAnalyticsEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const limit = parseInt(req.query.limit as string) || 10;

    const data = await cacheWrap(
      CacheKeys.ANALYTICS_EMPLOYEES(year),
      async () => {
        // Top leave takers
        const employeeLeaves = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
          },
          include: [{
            model: Employee, as: 'employee',
            attributes: ['id', 'firstName', 'lastName', 'employeeId'],
            include: [{ model: Department, as: 'department', attributes: ['name'] }],
          }],
          attributes: [
            'employeeId',
            [fn('SUM', col('LeaveRequest.duration')), 'totalDays'],
            [fn('COUNT', col('LeaveRequest.id')), 'requestCount'],
            [fn('AVG', col('LeaveRequest.duration')), 'avgDuration'],
          ],
          group: ['employeeId', 'employee.id', 'employee.firstName', 'employee.lastName', 'employee.employeeId', 'employee->department.id', 'employee->department.name'],
          order: [[literal('SUM(`LeaveRequest`.`duration`)'), 'DESC']],
          limit,
          raw: true,
        }) as unknown as EmployeeLeaveRow[];

        const topTakers = employeeLeaves.map((item) => ({
          id: item['employee.id'],
          employeeId: item['employee.employeeId'],
          firstName: item['employee.firstName'],
          lastName: item['employee.lastName'],
          department: item['employee.department.name'] || '',
          totalDays: Number(item.totalDays) || 0,
          requestCount: Number(item.requestCount) || 0,
          avgDuration: Math.round((Number(item.avgDuration) || 0) * 10) / 10,
        }));

        const totalActiveEmployees = await Employee.count({
          where: { deletedAt: null as null } as Record<string, unknown>,
          include: [{ model: User, as: 'user', where: { isActive: true }, required: true }],
        });

        const employeesWithLeaves = await LeaveRequest.findAll({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
          } as Record<string, unknown>,
          attributes: [[fn('DISTINCT', col('employeeId')), 'employeeId']],
          raw: true,
        }) as unknown as DistinctEmployeeRow[];

        const totalLeavesCount = await LeaveRequest.count({
          where: {
            status: 'approved',
            startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
          },
        });

        return {
          topTakers,
          totalActiveEmployees,
          employeesWithLeavesCount: employeesWithLeaves.length,
          employeesWithoutLeaves: totalActiveEmployees - employeesWithLeaves.length,
          totalApprovedLeaves: totalLeavesCount,
        };
      },
      300, // 5 min TTL
    );

    res.json(data);
  } catch (error) {
    logger.error('Analytics employees error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load employee analytics.' });
  }
};

// GET /api/analytics/utilization
export const getAnalyticsUtilization = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const data = await cacheWrap(
      CacheKeys.ANALYTICS_UTILIZATION(year),
      async () => {
        // Leave utilization by type
        const balances = await LeaveBalance.findAll({
          where: { year },
          include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
          attributes: [
            'leaveTypeId',
            [fn('SUM', col('allocated')), 'totalAllocated'],
            [fn('SUM', col('used')), 'totalUsed'],
          ],
          group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
          raw: true,
        }) as unknown as UtilizationRow[];

        const utilization = balances.map((item) => {
          const allocated = Number(item.totalAllocated) || 0;
          const used = Number(item.totalUsed) || 0;
          return {
            name: item['leaveType.name'] || 'Unknown',
            color: item['leaveType.color'] || '#3B82F6',
            totalAllocated: allocated,
            totalUsed: used,
            totalRemaining: Math.max(0, allocated - used),
            utilizationRate: allocated > 0 ? Math.round((used / allocated) * 100) : 0,
          };
        });

        // Department utilization
        const departments = await Department.findAll({
          include: [{
            model: Employee, as: 'employees',
            attributes: [],
            include: [{
              model: LeaveRequest, as: 'leaveRequests',
              where: {
                status: 'approved',
                startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
              },
              attributes: [],
            }],
          }],
          attributes: [
            'id', 'name',
            [fn('COALESCE', fn('SUM', col('employees->leaveRequests.duration')), 0), 'totalDays'],
            [fn('COUNT', fn('DISTINCT', col('employees.id'))), 'employeeCount'],
          ],
          group: ['Department.id', 'Department.name'],
          raw: true,
        }) as unknown as DepartmentRow[];

        const departmentUtilization = departments.map((d) => ({
          department: d.name,
          totalDays: Number(d.totalDays) || 0,
          employeeCount: Number(d.employeeCount) || 0,
          avgDaysPerEmployee: Number(d.employeeCount) > 0
            ? Math.round((Number(d.totalDays) / Number(d.employeeCount)) * 10) / 10
            : 0,
        }));

        return {
          leaveUtilization: utilization,
          departmentUtilization,
        };
      },
      300, // 5 min TTL
    );

    res.json(data);
  } catch (error) {
    logger.error('Analytics utilization error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load utilization data.' });
  }
};
