import { Request } from 'express';

export interface SocketNotification {
  title: string;
  message: string;
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'leave_cancelled' | 'balance_adjusted' | 'employee_created' | 'info';
  link?: string;
  timestamp?: string;
}

/**
 * Emit a notification to a specific user via Socket.IO.
 * @param req - Express request object (used to access the io instance)
 * @param userId - The user ID to notify
 * @param notification - The notification payload
 */
export function emitToUser(req: Request, userId: number, notification: SocketNotification): void {
  const io = req.app.get('io');
  if (!io) return;

  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: notification.timestamp || new Date().toISOString(),
  });
}

/**
 * Emit a notification to multiple users.
 * @param req - Express request object
 * @param userIds - Array of user IDs to notify
 * @param notification - The notification payload
 */
export function emitToUsers(req: Request, userIds: number[], notification: SocketNotification): void {
  const io = req.app.get('io');
  if (!io) return;

  const payload = {
    ...notification,
    timestamp: notification.timestamp || new Date().toISOString(),
  };

  for (const userId of userIds) {
    io.to(`user:${userId}`).emit('notification', payload);
  }
}

/**
 * Emit a leave balance update event to a user.
 * @param req - Express request object
 * @param userId - The user ID to notify
 * @param employeeName - The employee name for context
 * @param leaveType - The leave type name
 * @param newBalance - The new remaining balance
 */
export function emitBalanceUpdate(
  req: Request,
  userId: number,
  employeeName: string,
  leaveType: string,
  newBalance: number
): void {
  emitToUser(req, userId, {
    title: 'Leave Balance Updated',
    message: `${employeeName}'s ${leaveType} balance is now ${newBalance} days.`,
    type: 'balance_adjusted',
    link: '/leave-credits',
  });
}
