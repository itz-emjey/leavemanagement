import { Resend } from 'resend';
import { logger } from '../utils/logger';

const resendApiKey = process.env.RESEND_API_KEY || '';

let resend: Resend | null = null;

try {
  if (resendApiKey) {
    resend = new Resend(resendApiKey);
  }
} catch {
  logger.warn('Failed to initialize Resend. Email sending will be disabled.');
}

const fromEmail = process.env.EMAIL_FROM || 'noreply@leavemanagement.com';

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  if (!resend) {
    logger.info(`[EMAIL DISABLED] Password reset email to ${to}: token=${resetToken}`);
    return;
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Reset Your Password - Leave Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', -apple-system, sans-serif; background: #f7f8fc; margin: 0; padding: 0; }
            .container { max-width: 480px; margin: 40px auto; padding: 32px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
            .header { text-align: center; margin-bottom: 24px; }
            .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #5B5FEF, #7C80F2); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
            .logo span { color: white; font-weight: bold; font-size: 18px; }
            h1 { font-size: 20px; color: #1a1a2e; margin: 0 0 8px; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px; }
            .btn { display: inline-block; padding: 12px 32px; background: #5B5FEF; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; }
            .btn:hover { background: #4A4DE0; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #94a3b8; text-align: center; }
            .url-fallback { margin-top: 12px; padding: 12px; background: #f7f8fc; border-radius: 8px; font-size: 12px; color: #64748b; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><span>LM</span></div>
              <h1>Reset Your Password</h1>
              <p>You recently requested to reset your password for the Leave Management System. Click the button below to set a new password.</p>
            </div>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="btn">Reset Password</a>
            </div>
            <div class="url-fallback">
              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p style="font-family: monospace; margin-top: 4px;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
              <p style="margin-top: 4px;">Leave Management System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${to}`, { error: (error as Error).message });
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  if (!resend) {
    logger.info(`[EMAIL DISABLED] Notification email to ${to}: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
    });
    logger.info(`Notification email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Failed to send notification email to ${to}`, { error: (error as Error).message });
  }
}

export async function sendLeaveNotificationEmail(
  to: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  duration: number,
  status: string,
  reason?: string
): Promise<void> {
  const statusColors: Record<string, string> = {
    approved: '#22C55E',
    rejected: '#EF4444',
    pending: '#F59E0B',
  };

  const statusIcons: Record<string, string> = {
    approved: '✅',
    rejected: '❌',
    pending: '⏳',
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f7f8fc; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; padding: 32px; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .header { text-align: center; margin-bottom: 24px; }
        .status-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; color: white; background: ${statusColors[status] || '#64748b'}; }
        h1 { font-size: 20px; color: #1a1a2e; margin: 0 0 8px; }
        .details { background: #f7f8fc; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .detail-row .label { color: #64748b; }
        .detail-row .value { color: #1a1a2e; font-weight: 500; }
        p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 12px; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8ecf1; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 32px; margin-bottom: 12px;">${statusIcons[status] || '📋'}</div>
          <h1>Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
          <span class="status-badge">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
        <p>Hello,</p>
        <p>${employeeName}'s leave request has been <strong>${status}</strong>.</p>
        <div class="details">
          <div class="detail-row"><span class="label">Leave Type</span><span class="value">${leaveType}</span></div>
          <div class="detail-row"><span class="label">Start Date</span><span class="value">${startDate}</span></div>
          <div class="detail-row"><span class="label">End Date</span><span class="value">${endDate}</span></div>
          <div class="detail-row"><span class="label">Duration</span><span class="value">${duration} day${duration !== 1 ? 's' : ''}</span></div>
          ${reason ? `<div class="detail-row"><span class="label">${status === 'rejected' ? 'Rejection Reason' : 'Reason'}</span><span class="value">${reason}</span></div>` : ''}
        </div>
        <div class="footer">
          <p>Leave Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendNotificationEmail(
    to,
    `Leave ${status.charAt(0).toUpperCase() + status.slice(1)} - ${employeeName} - ${leaveType}`,
    html
  );
}
