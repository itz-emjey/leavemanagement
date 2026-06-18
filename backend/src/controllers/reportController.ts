import { Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { LeaveRequest, LeaveType, LeaveBalance, Department, Employee } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// Types for raw query results
interface TrendRow {
  month: number;
  count: number;
  status: string;
}

interface DistributionRow {
  'leaveType.name': string;
  'leaveType.color': string;
  totalDays: number;
}

interface DepartmentRow {
  name: string;
  totalDays: number;
  employeeCount: number;
  id: number;
}

interface SummaryRow {
  totalDays: number;
}

export const getReportTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const departmentId = req.query.departmentId as string;

    const where: Record<string, unknown> = {
      status: { [Op.in]: ['approved', 'rejected'] },
      startDate: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      },
    };

    const employeeWhere: Record<string, unknown> = {};
    if (departmentId) employeeWhere.departmentId = parseInt(departmentId);

    const trends = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: Employee, as: 'employee',
          where: Object.keys(employeeWhere).length ? employeeWhere : undefined,
          attributes: [],
        },
      ],
      attributes: [
        [fn('MONTH', col('LeaveRequest.startDate')), 'month'],
        [fn('COUNT', col('LeaveRequest.id')), 'count'],
        'status',
      ],
      group: [fn('MONTH', col('LeaveRequest.startDate')), 'status'],
      raw: true,
    }) as unknown as TrendRow[];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { month: string; approved: number; rejected: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const approved = trends.find((r) => r.month === i + 1 && r.status === 'approved');
      const rejected = trends.find((r) => r.month === i + 1 && r.status === 'rejected');
      monthlyData.push({
        month: monthNames[i],
        approved: approved ? Number(approved.count) : 0,
        rejected: rejected ? Number(rejected.count) : 0,
      });
    }

    res.json(monthlyData);
  } catch (error) {
    logger.error('Report trends error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load report trends.' });
  }
};

export const getReportLeaveTypeDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const departmentId = req.query.departmentId as string;

    const where: Record<string, unknown> = {
      status: 'approved',
      startDate: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      },
    };

    const employeeWhere: Record<string, unknown> = {};
    if (departmentId) employeeWhere.departmentId = parseInt(departmentId);

    const distribution = await LeaveRequest.findAll({
      where,
      include: [
        {
          model: LeaveType, as: 'leaveType', attributes: ['name', 'color'],
        },
        {
          model: Employee, as: 'employee',
          where: Object.keys(employeeWhere).length ? employeeWhere : undefined,
          attributes: [],
        },
      ],
      attributes: [[fn('SUM', col('LeaveRequest.duration')), 'totalDays'], 'leaveTypeId'],
      group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
      raw: true,
    }) as unknown as DistributionRow[];

    const data = distribution.map((item) => ({
      name: item['leaveType.name'] || 'Unknown',
      value: Number(item.totalDays) || 0,
      color: item['leaveType.color'] || '#3B82F6',
    }));

    res.json(data);
  } catch (error) {
    logger.error('Report distribution error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load leave type distribution.' });
  }
};

export const getReportDepartmentComparison = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

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

    const data = departments.map((d) => ({
      department: d.name,
      totalDays: Number(d.totalDays) || 0,
      employeeCount: Number(d.employeeCount) || 0,
      avgDaysPerEmployee: Number(d.employeeCount) > 0 ? (Number(d.totalDays) / Number(d.employeeCount)).toFixed(1) : '0',
    }));

    res.json(data);
  } catch (error) {
    logger.error('Report department error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load department comparison.' });
  }
};

// GET /api/reports/export-csv
export const getReportExportCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const totalRequests = await LeaveRequest.count({
      where: { startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
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
    }) as unknown as SummaryRow[];
    const totalDays = Number(totalDaysResult[0]?.totalDays) || 0;

    // Leave type distribution
    const distribution = await LeaveRequest.findAll({
      where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      attributes: [[fn('SUM', col('LeaveRequest.duration')), 'totalDays'], 'leaveTypeId'],
      group: ['leaveTypeId', 'leaveType.id', 'leaveType.name', 'leaveType.color'],
      raw: true,
    }) as unknown as DistributionRow[];

    // Department comparison
    const departments = await Department.findAll({
      include: [{
        model: Employee, as: 'employees', attributes: [],
        include: [{
          model: LeaveRequest, as: 'leaveRequests',
          where: { status: 'approved', startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
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

    // Build CSV
    const rows: string[] = [];
    rows.push('Leave Management Report - ' + year);
    rows.push('');
    rows.push('Summary');
    rows.push(`Total Requests,${totalRequests}`);
    rows.push(`Approved,${approvedRequests}`);
    rows.push(`Pending,${pendingRequests}`);
    rows.push(`Rejected,${rejectedRequests}`);
    rows.push(`Total Days,${totalDays}`);
    rows.push('');
    rows.push('Leave Type Distribution');
    rows.push('Leave Type,Days Taken');
    distribution.forEach((item) => {
      rows.push(`${item['leaveType.name'] || 'Unknown'},${Number(item.totalDays) || 0}`);
    });
    rows.push('');
    rows.push('Department Comparison');
    rows.push('Department,Total Days,Employees,Avg Days/Employee');
    departments.forEach((d) => {
      const avg = Number(d.employeeCount) > 0 ? (Number(d.totalDays) / Number(d.employeeCount)).toFixed(1) : '0';
      rows.push(`${d.name},${Number(d.totalDays) || 0},${Number(d.employeeCount) || 0},${avg}`);
    });

    const csvContent = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leave-report-${year}.csv`);
    res.send(csvContent);
  } catch (error) {
    logger.error('CSV export error', { error: String(error) });
    res.status(500).json({ message: 'Failed to export CSV.' });
  }
};

// GET /api/reports/employee-statement
export const getEmployeeLeaveStatement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (!employeeId) {
      res.status(400).json({ message: 'Employee ID is required.' });
      return;
    }

    const employee = await Employee.findByPk(employeeId, {
      include: [{ model: Department, as: 'department', attributes: ['name'] }],
      attributes: ['id', 'firstName', 'lastName', 'employeeId', 'position', 'email', 'hireDate'],
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    // Get all leaves taken
    const leaveRequests = await LeaveRequest.findAll({
      where: {
        employeeId,
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
      order: [['startDate', 'DESC']],
    });

    // Get balances
    const balances = await LeaveBalance.findAll({
      where: { employeeId, year },
      include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] }],
    });

    const approvedLeaves = leaveRequests.filter((lr) => lr.status === 'approved');
    const totalDaysTaken = approvedLeaves.reduce((sum, lr) => sum + Number(lr.duration), 0);

    res.json({
      employee,
      year,
      leaveRequests: leaveRequests.map((lr) => {
        const lt = lr.get('leaveType') as { name: string; color: string } | undefined;
        return {
          id: lr.id,
          leaveType: lt?.name || null,
          leaveTypeColor: lt?.color || null,
          startDate: lr.startDate,
          endDate: lr.endDate,
          duration: lr.duration,
          status: lr.status,
          reason: lr.reason,
        };
      }),
      balances: balances.map((lb) => {
        const lt = lb.get('leaveType') as { name: string; color: string } | undefined;
        return {
          leaveType: lt?.name || null,
          color: lt?.color || null,
          allocated: Number(lb.allocated),
          used: Number(lb.used),
          remaining: Number(lb.remaining),
        };
      }),
      totalDaysTaken,
    });
  } catch (error) {
    logger.error('Employee statement error', { error: String(error) });
    res.status(500).json({ message: 'Failed to fetch employee statement.' });
  }
};

export const getReportSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const totalRequests = await LeaveRequest.count({
      where: {
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    const approvedRequests = await LeaveRequest.count({
      where: {
        status: 'approved',
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    const pendingRequests = await LeaveRequest.count({
      where: {
        status: 'pending',
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    const rejectedRequests = await LeaveRequest.count({
      where: {
        status: 'rejected',
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
    });

    const totalDaysResult = await LeaveRequest.findAll({
      where: {
        status: 'approved',
        startDate: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` },
      },
      attributes: [[fn('SUM', col('duration')), 'totalDays']],
      raw: true,
    }) as unknown as SummaryRow[];

    const totalDays = Number(totalDaysResult[0]?.totalDays) || 0;
    const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

    res.json({
      year,
      totalRequests,
      approvedRequests,
      pendingRequests,
      rejectedRequests,
      totalDays,
      approvalRate,
    });
  } catch (error) {
    logger.error('Report summary error', { error: String(error) });
    res.status(500).json({ message: 'Failed to load report summary.' });
  }
};
