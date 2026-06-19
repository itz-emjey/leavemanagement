import { Response } from 'express';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { LeaveRequest, LeaveBalance, Employee, LeaveType, Department, Notification, User, AuditLog, LeaveRequestApproval } from '../models';
import { AuthRequest } from '../middleware/auth';
import { sendLeaveNotificationEmail } from '../utils/email';
import { Employee as EmployeeModel } from '../models';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { ROLES } from '../utils/roles';
import { logger } from '../utils/logger';
import { emitToUsers, emitToUser } from '../utils/socketEmitter';
import { cacheDelete, cacheInvalidateByPrefix, CacheKeys } from '../utils/cache';

// GET /api/leave-requests
export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page as string, req.query.limit as string);
    const status = req.query.status as string;
    const departmentId = req.query.departmentId as string;
    const leaveTypeId = req.query.leaveTypeId as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (status) where.status = status;
    if (leaveTypeId) where.leaveTypeId = parseInt(leaveTypeId);
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };

    const employeeWhere: any = { deletedAt: null };
    if (departmentId) employeeWhere.departmentId = parseInt(departmentId);
    if (search) {
      employeeWhere[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
      ];
    }

    // If user is employee, only show their own requests
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ where: { userId: req.user.userId } });
      if (emp) where.employeeId = emp.id;
    }

    // If user is manager, show their department's requests + their own
    if (req.user?.role === 'manager') {
      const emp = await Employee.findOne({
        where: { userId: req.user.userId },
        include: [{ model: Employee, as: 'subordinates', attributes: ['id'] }],
      });
      if (emp) {
        const subordinates = (emp as unknown as { subordinates?: EmployeeModel[] }).subordinates || [];
        const subordinateIds = subordinates.map((s) => s.id);
        subordinateIds.push(emp.id); // Include manager's own leaves
        where.employeeId = { [Op.in]: subordinateIds };
      }
    }

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where,
      attributes: ['id', 'employeeId', 'leaveTypeId', 'startDate', 'endDate', 'duration', 'status', 'reason', 'rejectionReason', 'createdAt', 'approverId'],
      include: [
        {
          model: Employee, as: 'employee',
          where: Object.keys(employeeWhere).length > 1 ? employeeWhere : undefined,
          attributes: ['id', 'firstName', 'lastName', 'employeeId', 'signature'],
          include: [{ model: Department, as: 'department', attributes: ['name'] }],
        },
        { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'color'] },
        {
          model: Employee, as: 'approver',
          attributes: ['id', 'firstName', 'lastName', 'position', 'signature'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      requests: rows,
      pagination: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    logger.error('Get leave requests error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch leave requests.' });
  }
};

// POST /api/leave-requests
export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveTypeId, startDate, endDate, reason, duration, durationType, startTime, endTime } = req.body;

    if (!leaveTypeId || !startDate || !endDate || !duration) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const employee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee profile not found.' });
      return;
    }

    // Check for overlapping leave
    const overlap = await LeaveRequest.findOne({
      where: {
        employeeId: employee.id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (overlap) {
      res.status(400).json({ message: 'You already have a leave request overlapping these dates.' });
      return;
    }

    // Check leave balance
    const balance = await LeaveBalance.findOne({
      where: { employeeId: employee.id, leaveTypeId, year: new Date().getFullYear() },
    });

    if (balance && Number(balance.remaining) < Number(duration)) {
      res.status(400).json({ message: `Insufficient leave balance. You have ${balance.remaining} days remaining.` });
      return;
    }

    const attachment = req.file ? req.file.filename : undefined;

    const leaveRequest = await LeaveRequest.create({
      employeeId: employee.id,
      leaveTypeId,
      startDate,
      endDate,
      duration,
      durationType: durationType || 'full',
      startTime: startTime || null,
      endTime: endTime || null,
      reason,
      status: 'pending',
      attachment,
    });

    // Notify managers and admins
    const notificationUsers = await User.findAll({
      where: {
        isActive: true,
        roleId: { [Op.in]: [ROLES.ADMIN, ROLES.MANAGER] }
      },
    });

    // Also notify the employee's manager if they have one
    if (employee.managerId) {
      const managerEmp = await Employee.findByPk(employee.managerId, { include: [{ model: User, as: 'user' }] });
      const managerUser = managerEmp?.get('user') as User | undefined;
      if (managerUser) {
        notificationUsers.push(managerUser);
      }
    }

    // Deduplicate by userId
    const seen = new Set<number>();
    for (const user of notificationUsers) {
      if (!seen.has(user.id)) {
        seen.add(user.id);
        await Notification.create({
          userId: user.id,
          title: 'New Leave Request',
          message: `${employee.firstName} ${employee.lastName} submitted a ${duration}-day leave request.`,
          type: 'leave_request',
          link: '/leave-requests',
        });
      }
    }

    // Invalidate dashboard + analytics caches
    cacheDelete(CacheKeys.DASHBOARD_ADMIN);
    cacheInvalidateByPrefix('dashboard:employee:');
    cacheDelete(CacheKeys.ANALYTICS_OVERVIEW(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_TRENDS(new Date().getFullYear()));

    // Socket.IO real-time emit
    emitToUsers(req, Array.from(seen), {
      title: 'New Leave Request',
      message: `${employee.firstName} ${employee.lastName} submitted a ${duration}-day leave request.`,
      type: 'leave_request',
      link: '/leave-requests',
    });

    // Send email notifications and track delivery
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    for (const user of notificationUsers) {
      if (!seen.has(user.id)) continue;
      try {
        await sendLeaveNotificationEmail(
          user.email,
          `${employee.firstName} ${employee.lastName}`,
          leaveType?.name || 'Leave',
          startDate,
          endDate,
          Number(duration),
          'pending',
          reason
        );
        // Mark notification as email sent
        const notif = await Notification.findOne({
          where: { userId: user.id, type: 'leave_request', isEmailSent: false },
          order: [['createdAt', 'DESC']],
        });
        if (notif) {
          await notif.update({ isEmailSent: true });
        }
      } catch (emailError) {
        logger.error('Failed to send leave request email', {
          error: (emailError as Error).message,
          userId: user.id,
        });
      }
    }

    res.status(201).json({ message: 'Leave request submitted successfully.', leaveRequest });
  } catch (error) {
    logger.error('Create leave request error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to submit leave request.' });
  }
};

// PATCH /api/leave-requests/:id/approve
export const approveLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [
        { model: Employee, as: 'employee' },
        { model: LeaveType, as: 'leaveType' },
      ],
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    if (leaveRequest.status !== 'pending') {
      res.status(400).json({ message: `Cannot approve a ${leaveRequest.status} request.` });
      return;
    }

    const employee = await Employee.findByPk(leaveRequest.employeeId);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const balance = await LeaveBalance.findOne({
      where: {
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year: new Date().getFullYear(),
      },
    });

    if (balance && Number(balance.remaining) < Number(leaveRequest.duration)) {
      res.status(400).json({ message: 'Insufficient leave balance.' });
      return;
    }

    // Look up the approver's Employee record
    const approverEmployee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!approverEmployee) {
      res.status(404).json({ message: 'Approver employee record not found.' });
      return;
    }

    // Manager scope guard: managers can only approve requests from their department
    if (req.user?.role === 'manager') {
      const requestingEmployee = await Employee.findByPk(leaveRequest.employeeId);
      if (!requestingEmployee || requestingEmployee.departmentId !== approverEmployee.departmentId) {
        res.status(403).json({ message: 'You can only approve leave requests from your own department.' });
        return;
      }
    }

    // Use DB transaction for atomicity
    const result = await sequelize.transaction(async (t: Transaction) => {
      await leaveRequest.update({
        status: 'approved',
        approverId: approverEmployee.id, // Store Employee ID, not User ID
      }, { transaction: t });

      if (balance) {
        await balance.update({
          used: Number(balance.used) + Number(leaveRequest.duration),
          remaining: Number(balance.remaining) - Number(leaveRequest.duration),
        }, { transaction: t });
      } else {
        // Create a default balance record if none exists
        await LeaveBalance.create({
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year: new Date().getFullYear(),
          allocated: 0,
          used: Number(leaveRequest.duration),
          remaining: -Number(leaveRequest.duration),
        }, { transaction: t });
      }

      return leaveRequest;
    });

    // Invalidate dashboard + analytics caches
    cacheDelete(CacheKeys.DASHBOARD_ADMIN);
    cacheDelete(CacheKeys.DASHBOARD_EMPLOYEE(leaveRequest.employeeId));
    cacheDelete(CacheKeys.ANALYTICS_OVERVIEW(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_EMPLOYEES(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_UTILIZATION(new Date().getFullYear()));

    // Notify employee
    if (employee.userId) {
      const notification = await Notification.create({
        userId: employee.userId,
        title: 'Leave Approved',
        message: `Your ${leaveRequest.duration}-day leave request has been approved.`,
        type: 'leave_approved',
        link: '/leave-requests',
      });

      // Socket.IO real-time emit
      emitToUser(req, employee.userId, {
        title: notification.title,
        message: notification.message,
        type: 'leave_approved',
        link: notification.link,
      });

      // Send email notification and track delivery
      try {
        await sendLeaveNotificationEmail(
          employee.email,
          `${employee.firstName} ${employee.lastName}`,
          'Leave',
          leaveRequest.startDate,
          leaveRequest.endDate,
          Number(leaveRequest.duration),
          'approved'
        );
        await notification.update({ isEmailSent: true });
      } catch (emailError) {
        logger.error('Failed to send leave approval email', {
          error: (emailError as Error).message,
          employeeId: employee.id,
        });
      }
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'approve',
      entity: 'leave_request',
      entityId: leaveRequest.id,
      details: `Approved ${leaveRequest.duration}-day leave request #${leaveRequest.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Leave request approved successfully.', leaveRequest: result });
  } catch (error) {
    logger.error('Approve error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to approve leave request.' });
  }
};

// PATCH /api/leave-requests/:id/reject
export const rejectLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    // Validate outside transaction
    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }],
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    if (leaveRequest.status !== 'pending') {
      res.status(400).json({ message: `Cannot reject a ${leaveRequest.status} request.` });
      return;
    }

    // Look up the approver's Employee record
    const approverEmployee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!approverEmployee) {
      res.status(404).json({ message: 'Approver employee record not found.' });
      return;
    }

    // Manager scope guard: managers can only reject requests from their department
    if (req.user?.role === 'manager') {
      const requestingEmployee = await Employee.findByPk(leaveRequest.employeeId);
      if (!requestingEmployee || requestingEmployee.departmentId !== approverEmployee.departmentId) {
        res.status(403).json({ message: 'You can only reject leave requests from your own department.' });
        return;
      }
    }

    // Use DB transaction for atomic state change
    await sequelize.transaction(async (t: Transaction) => {
      await leaveRequest.update({
        status: 'rejected',
        rejectionReason: reason || 'No reason provided',
        approverId: approverEmployee.id,
      }, { transaction: t });

      await AuditLog.create({
        userId: req.user!.userId,
        action: 'reject',
        entity: 'leave_request',
        entityId: leaveRequest.id,
        details: `Rejected leave request #${leaveRequest.id}. Reason: ${reason || 'No reason provided'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }, { transaction: t });
    });

    // Invalidate dashboard + analytics caches
    cacheDelete(CacheKeys.DASHBOARD_ADMIN);
    cacheDelete(CacheKeys.DASHBOARD_EMPLOYEE(leaveRequest.employeeId));
    cacheDelete(CacheKeys.ANALYTICS_OVERVIEW(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_EMPLOYEES(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_UTILIZATION(new Date().getFullYear()));

    // Non-critical operations after transaction
    const leaveRequestEmployee = leaveRequest.get('employee') as EmployeeModel | undefined;
    if (leaveRequestEmployee?.userId) {
      const notification = await Notification.create({
        userId: leaveRequestEmployee.userId,
        title: 'Leave Rejected',
        message: `Your leave request has been rejected. Reason: ${reason || 'No reason provided'}`,
        type: 'leave_rejected',
        link: '/leave-requests',
      });

      // Socket.IO real-time emit
      if (leaveRequestEmployee?.userId) {
        emitToUser(req, leaveRequestEmployee.userId, {
          title: notification.title,
          message: notification.message,
          type: 'leave_rejected',
          link: notification.link,
        });
      }

      // Send email notification and track delivery
      if (leaveRequestEmployee?.email) {
        try {
          await sendLeaveNotificationEmail(
            leaveRequestEmployee.email,
            `${leaveRequestEmployee.firstName} ${leaveRequestEmployee.lastName}`,
            'Leave',
            leaveRequest.startDate,
            leaveRequest.endDate,
            Number(leaveRequest.duration),
            'rejected',
            reason || 'No reason provided'
          );
          await notification.update({ isEmailSent: true });
        } catch (emailError) {
          logger.error('Failed to send leave rejection email', {
            error: (emailError as Error).message,
            employeeId: leaveRequest.employeeId,
          });
        }
      }
    }

    res.json({ message: 'Leave request rejected.', leaveRequest });
  } catch (error) {
    logger.error('Reject error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to reject leave request.' });
  }
};

// PATCH /api/leave-requests/:id/cancel
export const cancelLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate outside transaction
    const leaveRequest = await LeaveRequest.findByPk(req.params.id);

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    if (leaveRequest.status !== 'pending') {
      res.status(400).json({ message: 'Only pending requests can be cancelled.' });
      return;
    }

    // Use DB transaction for atomic state change
    await sequelize.transaction(async (t: Transaction) => {
      await leaveRequest.update({ status: 'cancelled' }, { transaction: t });

      await AuditLog.create({
        userId: req.user!.userId,
        action: 'cancel',
        entity: 'leave_request',
        entityId: leaveRequest.id,
        details: `Cancelled leave request #${leaveRequest.id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }, { transaction: t });
    });

    // Invalidate dashboard + analytics caches
    cacheDelete(CacheKeys.DASHBOARD_ADMIN);
    cacheDelete(CacheKeys.DASHBOARD_EMPLOYEE(leaveRequest.employeeId));
    cacheDelete(CacheKeys.ANALYTICS_OVERVIEW(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_EMPLOYEES(new Date().getFullYear()));
    cacheDelete(CacheKeys.ANALYTICS_UTILIZATION(new Date().getFullYear()));

    // Socket.IO real-time notify managers/admins
    const adminUsers = await User.findAll({
      where: { isActive: true, roleId: { [Op.in]: [ROLES.ADMIN, ROLES.MANAGER] } },
    });
    emitToUsers(req, adminUsers.map((u) => u.id), {
      title: 'Leave Request Cancelled',
      message: `Leave request #${leaveRequest.id} was cancelled.`,
      type: 'leave_cancelled',
      link: '/leave-requests',
    });

    res.json({ message: 'Leave request cancelled.' });
  } catch (error) {
    logger.error('Cancel error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to cancel leave request.' });
  }
};

// POST /api/leave-requests/:id/level-approve
export const levelApproveLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
      return;
    }

    const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
      include: [{ model: Employee, as: 'employee' }],
    });

    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    if (leaveRequest.status !== 'pending') {
      res.status(400).json({ message: `Cannot process a ${leaveRequest.status} request.` });
      return;
    }

    const approverEmployee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!approverEmployee) {
      res.status(404).json({ message: 'Approver employee record not found.' });
      return;
    }

    // Manager scope guard
    if (req.user?.role === 'manager') {
      const requestingEmployee = await Employee.findByPk(leaveRequest.employeeId);
      if (!requestingEmployee || requestingEmployee.departmentId !== approverEmployee.departmentId) {
        res.status(403).json({ message: 'You can only process leave requests from your own department.' });
        return;
      }
    }

    // Find existing approvals for this request to determine current level
    const existingApprovals = await LeaveRequestApproval.findAll({
      where: { leaveRequestId: leaveRequest.id },
      order: [['level', 'ASC']],
    });

    // Determine the current approval level
    const maxLevel = existingApprovals.length > 0
      ? Math.max(...existingApprovals.map((a: any) => a.level))
      : 0;

    const nextLevel = maxLevel + 1;

    // Check if approver is eligible for this level
    // Level 1: direct manager or any manager in the department
    // Level 2: any admin
    if (nextLevel === 1 && req.user?.role !== 'manager' && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Only managers can perform level 1 approval.' });
      return;
    }
    if (nextLevel === 2 && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can perform level 2 approval.' });
      return;
    }

    if (status === 'rejected') {
      // Any rejection at any level rejects the whole request
      await LeaveRequestApproval.create({
        leaveRequestId: leaveRequest.id,
        approverId: approverEmployee.id,
        level: nextLevel,
        status: 'rejected',
        comment: comment || 'Rejected',
      });

      await leaveRequest.update({
        status: 'rejected',
        rejectionReason: comment || 'Rejected via multi-level approval',
        approverId: approverEmployee.id,
      });

      res.json({ message: 'Leave request rejected via multi-level approval.', leaveRequest });
      return;
    }

    // Create approval record
    await LeaveRequestApproval.create({
      leaveRequestId: leaveRequest.id,
      approverId: approverEmployee.id,
      level: nextLevel,
      status: 'approved',
      comment: comment || 'Approved',
    });

    // Level 2 (admin) approval finalizes the request
    if (nextLevel >= 2 || req.user?.role === 'admin') {
      // Final approval - also deduct balance
      const balance = await LeaveBalance.findOne({
        where: {
          employeeId: leaveRequest.employeeId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year: new Date().getFullYear(),
        },
      });

      await sequelize.transaction(async (t: Transaction) => {
        await leaveRequest.update({
          status: 'approved',
          approverId: approverEmployee.id,
        }, { transaction: t });

        if (balance) {
          await balance.update({
            used: Number(balance.used) + Number(leaveRequest.duration),
            remaining: Number(balance.remaining) - Number(leaveRequest.duration),
          }, { transaction: t });
        }
      });

      // Notify employee
      const employee = await Employee.findByPk(leaveRequest.employeeId);
      if (employee?.userId) {
        const notification = await Notification.create({
          userId: employee.userId,
          title: 'Leave Approved',
          message: `Your ${leaveRequest.duration}-day leave request has been fully approved.`,
          type: 'leave_approved',
          link: '/leave-requests',
        });
        emitToUser(req, employee.userId, {
          title: notification.title,
          message: notification.message,
          type: 'leave_approved',
          link: notification.link,
        });
      }

      res.json({ message: 'Leave request fully approved via multi-level workflow.', leaveRequest });
    } else {
      // Level 1 approved, waiting for level 2
      // Notify admins about level 2 pending approval
      const adminUsers = await User.findAll({
        where: { isActive: true, roleId: ROLES.ADMIN },
      });

      for (const user of adminUsers) {
        await Notification.create({
          userId: user.id,
          title: 'Level 2 Approval Needed',
          message: `Level 1 approved for leave request #${leaveRequest.id}. Admin approval required.`,
          type: 'leave_request',
          link: '/leave-requests',
        });
        emitToUser(req, user.id, {
          title: 'Level 2 Approval Needed',
          message: `Level 1 approved for leave request #${leaveRequest.id}. Admin approval required.`,
          type: 'leave_request',
          link: '/leave-requests',
        });
      }

      res.json({ message: 'Level 1 approved. Awaiting admin (level 2) approval.', leaveRequest });
    }
  } catch (error) {
    logger.error('Level approve error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to process multi-level approval.' });
  }
};

// GET /api/leave-requests/calendar
export const getLeaveRequestCalendar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const startDate = `${currentYear}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, month, 0).toISOString().split('T')[0];

    const whereClause: any = {
      status: { [Op.in]: ['approved', 'pending'] },
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate },
    };

    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ where: { userId: req.user.userId } });
      if (emp) whereClause.employeeId = emp.id;
    }

    const leaves = await LeaveRequest.findAll({
      where: whereClause,
      include: [
        { model: Employee, as: 'employee', attributes: ['firstName', 'lastName', 'employeeId'] },
        { model: LeaveType, as: 'leaveType', attributes: ['name', 'color'] },
      ],
      order: [['startDate', 'ASC']],
    });

    const events = leaves.map((lr: any) => ({
      id: String(lr.id),
      title: lr.employee
        ? `${lr.employee.firstName} ${lr.employee.lastName} - ${lr.leaveType?.name}`
        : `${lr.leaveType?.name}`,
      start: lr.startDate,
      end: lr.endDate,
      backgroundColor: lr.status === 'approved' ? (lr.leaveType?.color || '#3B82F6') : '#F59E0B',
      borderColor: lr.status === 'approved' ? (lr.leaveType?.color || '#3B82F6') : '#F59E0B',
      textColor: '#FFFFFF',
      extendedProps: {
        status: lr.status,
        employeeName: lr.employee ? `${lr.employee.firstName} ${lr.employee.lastName}` : '',
        leaveType: lr.leaveType?.name,
      },
    }));

    res.json({ events });
  } catch (error) {
    logger.error('Calendar error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch calendar events.' });
  }
};


