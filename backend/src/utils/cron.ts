import cron from 'node-cron';
import { Op } from 'sequelize';
import { LeaveRequest, Employee, User, LeaveType, Notification } from '../models';
import { sendLeaveNotificationEmail } from './email';
import { logger } from './logger';

/**
 * Initialize all cron jobs for the application.
 * Called once during server startup.
 */
export function initCronJobs(): void {
  // ── Upcoming leave reminder ──────────────────────────────
  // Runs every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Running upcoming leave reminder check...');
    try {
      await sendUpcomingLeaveReminders();
    } catch (error) {
      logger.error('[CRON] Upcoming leave reminder failed:', {
        error: (error as Error).message,
      });
    }
  });

  logger.info('[CRON] Scheduled jobs initialized.');
}

/**
 * Find all approved leave requests starting tomorrow and send
 * reminder emails + in-app notifications to the employees.
 */
async function sendUpcomingLeaveReminders(): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Find approved leaves starting tomorrow, include employee + user + leave type
  const upcomingLeaves = await LeaveRequest.findAll({
    where: {
      status: 'approved',
      startDate: tomorrowStr,
    },
    include: [
      {
        model: Employee,
        as: 'employee',
        include: [{ model: User, as: 'user' }],
      },
      { model: LeaveType, as: 'leaveType' },
    ],
  });

  if (upcomingLeaves.length === 0) {
    logger.info('[CRON] No upcoming leaves starting tomorrow.');
    return;
  }

  let sentCount = 0;

  for (const leave of upcomingLeaves) {
    const employee = leave.get('employee') as Employee | undefined;
    const leaveType = leave.get('leaveType') as LeaveType | undefined;
    const user = (employee as unknown as { user?: User })?.user;

    if (!employee || !user) {
      logger.warn('[CRON] Skipping leave reminder - missing employee or user', {
        leaveId: leave.id,
      });
      continue;
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;
    const leaveTypeName = leaveType?.name || 'Leave';

    // Create in-app notification with isEmailSent tracking
    await Notification.create({
      userId: user.id,
      title: 'Upcoming Leave Reminder',
      message: `Your ${leaveTypeName} leave starts tomorrow (${leave.startDate}). Enjoy your time off!`,
      type: 'leave_reminder',
      link: '/leave-requests',
      isEmailSent: false, // Will be set to true after email is sent
    });

    // Send reminder email
    try {
      await sendLeaveNotificationEmail(
        employee.email,
        employeeName,
        leaveTypeName,
        leave.startDate,
        leave.endDate,
        Number(leave.duration),
        'approved',
        'Reminder: Your leave starts tomorrow!'
      );

      // Update the most recent notification for this user about this leave
      const latestNotification = await Notification.findOne({
        where: {
          userId: user.id,
          type: 'leave_reminder',
          isEmailSent: false,
        },
        order: [['createdAt', 'DESC']],
      });

      if (latestNotification) {
        await latestNotification.update({ isEmailSent: true });
      }

      sentCount++;
      logger.info(`[CRON] Leave reminder sent to ${employee.email}`, {
        leaveId: leave.id,
        employeeName,
      });
    } catch (emailError) {
      logger.error(`[CRON] Failed to send reminder email to ${employee.email}`, {
        error: (emailError as Error).message,
        leaveId: leave.id,
      });
    }
  }

  logger.info(`[CRON] Leave reminder complete. Sent ${sentCount}/${upcomingLeaves.length} reminders.`);
}
