import { Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { User, Employee, Role, Department, AuditLog } from '../models';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../utils/email';
import config from '../config/constants';
import { ROLES } from '../utils/roles';
import { logger } from '../utils/logger';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// POST /api/auth/login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({
      where: { email },
      include: [
        { model: Role, as: 'role' },
        { model: Employee, as: 'employee' },
      ],
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const role = user.get('role') as { name: string } | undefined;
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      role: role?.name || 'employee',
    });

    // Set httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    await AuditLog.create({
      userId: user.id,
      action: 'login',
      entity: 'user',
      entityId: user.id,
      details: `User ${email} logged in`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const userEmployee = user.get('employee') as {
      id: number; firstName: string; lastName: string;
      employeeId: string; position: string; profilePicture?: string;
    } | undefined;

    res.json({
      message: 'Login successful.',
      token, // Keep token in response for backward compatibility
      user: {
        id: user.id,
        email: user.email,
        role: role?.name,
        employee: userEmployee
          ? {
              id: userEmployee.id,
              firstName: userEmployee.firstName,
              lastName: userEmployee.lastName,
              employeeId: userEmployee.employeeId,
              position: userEmployee.position,
              profilePicture: userEmployee.profilePicture,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error('Login error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/logout
export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully.' });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not
      res.json({ message: 'If the email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires,
    });

    // Log password reset request
    await AuditLog.create({
      userId: user.id,
      action: 'forgot_password',
      entity: 'user',
      entityId: user.id,
      details: `Password reset requested for ${email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send reset email via Resend
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token and new password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null as any,
      resetPasswordExpires: null as any,
    });

    await AuditLog.create({
      userId: user.id,
      action: 'reset_password',
      entity: 'user',
      entityId: user.id,
      details: `Password reset completed for ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    logger.error('Reset password error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// POST /api/auth/change-password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters.' });
      return;
    }

    const user = await User.findByPk(req.user!.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'change_password',
      entity: 'user',
      entityId: req.user!.userId,
      details: 'Password changed',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('Change password error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/auth/me
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.user!.userId, {
      include: [
        { model: Role, as: 'role' },
        {
          model: Employee,
          as: 'employee',
          include: [{ model: Department, as: 'department' }],
        },
      ],
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone } = req.body;
    const profilePicture = req.file?.filename;

    const employee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee profile not found.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;

    await employee.update(updateData);

    res.json({ message: 'Profile updated successfully.', employee });
  } catch (error) {
    logger.error('Update profile error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Internal server error.' });
  }
};
