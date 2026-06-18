import { Response } from 'express';
import { LeaveRequestApproval, AuditLog, LeaveRequest, Employee } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// GET /api/leave-request-approvals/:leaveRequestId
export const getApprovalsForRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveRequestId } = req.params;

    const approvals = await LeaveRequestApproval.findAll({
      where: { leaveRequestId: parseInt(leaveRequestId) },
      include: [
        { model: Employee, as: 'approver', attributes: ['id', 'firstName', 'lastName', 'employeeId'] },
      ],
      order: [['level', 'ASC']],
    });

    res.json({ approvals });
  } catch (error) {
    logger.error('Get approvals error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch approvals.' });
  }
};

// POST /api/leave-request-approvals
export const createApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { leaveRequestId, approverId, level } = req.body;

    if (!leaveRequestId || !approverId) {
      res.status(400).json({ message: 'leaveRequestId and approverId are required.' });
      return;
    }

    // Verify leave request exists
    const leaveRequest = await LeaveRequest.findByPk(leaveRequestId);
    if (!leaveRequest) {
      res.status(404).json({ message: 'Leave request not found.' });
      return;
    }

    // Check for duplicate level
    const existing = await LeaveRequestApproval.findOne({
      where: { leaveRequestId, level: level || 1 },
    });
    if (existing) {
      res.status(400).json({ message: `Approval level ${level || 1} already exists for this request.` });
      return;
    }

    const approval = await LeaveRequestApproval.create({
      leaveRequestId: parseInt(leaveRequestId),
      approverId: parseInt(approverId),
      level: level || 1,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'leave_request_approval',
      entityId: approval.id,
      details: `Created approval level ${level || 1} for leave request #${leaveRequestId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ message: 'Approval created successfully.', approval });
  } catch (error) {
    logger.error('Create approval error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create approval.' });
  }
};

// PATCH /api/leave-request-approvals/:id
export const updateApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be "approved" or "rejected".' });
      return;
    }

    const approval = await LeaveRequestApproval.findByPk(req.params.id);
    if (!approval) {
      res.status(404).json({ message: 'Approval not found.' });
      return;
    }

    if (approval.status !== 'pending') {
      res.status(400).json({ message: `Approval already ${approval.status}. Cannot change.` });
      return;
    }

    // Verify the requesting user is the designated approver
    const employee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!employee || employee.id !== approval.approverId) {
      // Admins can also approve any level
      if (req.user!.role !== 'admin') {
        res.status(403).json({ message: 'Not authorized to approve this level.' });
        return;
      }
    }

    await approval.update({
      status,
      comment: comment || undefined,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: status === 'approved' ? 'approve' : 'reject',
      entity: 'leave_request_approval',
      entityId: approval.id,
      details: `${status === 'approved' ? 'Approved' : 'Rejected'} level ${approval.level} for leave request #${approval.leaveRequestId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: `Approval ${status} successfully.`, approval });
  } catch (error) {
    logger.error('Update approval error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update approval.' });
  }
};

// DELETE /api/leave-request-approvals/:id
export const deleteApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const approval = await LeaveRequestApproval.findByPk(req.params.id);
    if (!approval) {
      res.status(404).json({ message: 'Approval not found.' });
      return;
    }

    await approval.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'leave_request_approval',
      entityId: parseInt(req.params.id),
      details: `Deleted approval level ${approval.level} for leave request #${approval.leaveRequestId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Approval deleted successfully.' });
  } catch (error) {
    logger.error('Delete approval error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete approval.' });
  }
};
