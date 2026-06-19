import { Response } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { Employee, User, Role, Department, LeaveBalance, LeaveType, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { ROLES } from '../utils/roles';
import { logger } from '../utils/logger';

// GET /api/employees
export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page as string, req.query.limit as string);
    const search = req.query.search as string;
    const departmentId = req.query.departmentId as string;
    const status = req.query.status as string;

    const where: any = { deletedAt: null };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (departmentId) where.departmentId = parseInt(departmentId);

    const userWhere: any = {};
    if (status === 'active') userWhere.isActive = true;
    if (status === 'inactive') userWhere.isActive = false;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        {
          model: User, as: 'user',
          attributes: ['id', 'email', 'isActive', 'roleId'],
          where: Object.keys(userWhere).length ? userWhere : undefined,
          include: [{ model: Role, as: 'role', attributes: ['name'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      employees: rows,
      pagination: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    logger.error('Get employees error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch employees.' });
  }
};

// GET /api/employees/:id
export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Department, as: 'department' },
        {
          model: User, as: 'user',
          attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
          include: [{ model: Role, as: 'role' }],
        },
        {
          model: LeaveBalance, as: 'leaveBalances',
          include: [{ model: LeaveType, as: 'leaveType' }],
        },
      ],
    });

    if (!employee || employee.deletedAt) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    res.json({ employee });
  } catch (error) {
    logger.error('Get employee error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch employee.' });
  }
};

// POST /api/employees
export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, position, departmentId, phone, hireDate, employeeId, managerId } = req.body;

    if (!firstName || !lastName || !email || !password || !position || !departmentId || !hireDate) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const empId = employeeId || `EMP-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    const user = await User.create({
      email,
      password: hashedPassword,
      roleId: ROLES.EMPLOYEE
    });

    const employee = await Employee.create({
      userId: user.id,
      employeeId: empId,
      firstName,
      lastName,
      email,
      position,
      departmentId: parseInt(departmentId),
      phone,
      hireDate,
      managerId: managerId ? parseInt(managerId) : undefined,
    });

    // Create leave balances for the year
    const leaveTypes = await LeaveType.findAll();
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await LeaveBalance.create({
        employeeId: employee.id,
        leaveTypeId: lt.id,
        allocated: lt.defaultDays,
        used: 0,
        remaining: lt.defaultDays,
        year: currentYear,
      });
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'employee',
      entityId: employee.id,
      details: `Created employee ${firstName} ${lastName} (${empId})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ message: 'Employee created successfully.', employee });
  } catch (error) {
    logger.error('Create employee error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create employee.' });
  }
};

// PUT /api/employees/:id
export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!employee || employee.deletedAt) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const { firstName, lastName, position, departmentId, phone, hireDate, email, managerId } = req.body;

    await employee.update({
      firstName: firstName || employee.firstName,
      lastName: lastName || employee.lastName,
      position: position || employee.position,
      departmentId: departmentId ? parseInt(departmentId) : employee.departmentId,
      phone: phone !== undefined ? phone : employee.phone,
      hireDate: hireDate || employee.hireDate,
      email: email || employee.email,
      managerId: managerId !== undefined ? (managerId ? parseInt(managerId) : undefined) : employee.managerId,
    });

    const empUser = employee.get('user') as { update: (data: Record<string, unknown>) => Promise<void> } | undefined;
    if (email && empUser) {
      await empUser.update({ email });
    }

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'update',
      entity: 'employee',
      entityId: employee.id,
      details: `Updated employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Employee updated successfully.', employee });
  } catch (error) {
    logger.error('Update employee error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update employee.' });
  }
};

// DELETE /api/employees/:id (soft delete)
export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee || employee.deletedAt) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    await employee.destroy(); // soft delete (paranoid)

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'employee',
      entityId: employee.id,
      details: `Deleted employee ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    logger.error('Delete employee error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete employee.' });
  }
};

// POST /api/employees/import
export const bulkImportEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fs = require('fs');
    const csvFile = req.file;
    if (!csvFile) {
      res.status(400).json({ message: 'CSV file is required.' });
      return;
    }

    const csvContent = fs.readFileSync(csvFile.path, 'utf-8');
    const lines = csvContent.split('\n').map((l: string) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      res.status(400).json({ message: 'CSV file must have a header row and at least one data row.' });
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const expectedHeaders = ['firstname', 'lastname', 'email', 'position', 'department'];

    // Validate headers have required fields
    const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      res.status(400).json({ message: `CSV missing required columns: ${missingHeaders.join(', ')}. Expected: firstname, lastname, email, position, department` });
      return;
    }

    const imported: any[] = [];
    const errors: string[] = [];
    const password = 'Welcome123'; // default password for imported employees
    const hashedPassword = await bcrypt.hash(password, 10);
    const leaveTypes = await LeaveType.findAll();
    const currentYear = new Date().getFullYear();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v: string) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => {
        row[h] = values[idx] || '';
      });

      try {
        if (!row.firstname || !row.lastname || !row.email || !row.position || !row.department) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Find or create department
        let dept = await Department.findOne({ where: { name: row.department } });
        if (!dept) {
          dept = await Department.create({ name: row.department, description: '' });
        }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: row.email } });
      if (existingUser) {
        errors.push(`Row ${i + 1}: Email ${row.email} already exists`);
        continue;
      }

        const empId = `EMP-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

        const user = await User.create({
          email: row.email,
          password: hashedPassword,
          roleId: ROLES.EMPLOYEE
        });

        const employee = await Employee.create({
          userId: user.id,
          employeeId: empId,
          firstName: row.firstname,
          lastName: row.lastname,
          email: row.email,
          position: row.position,
          departmentId: dept.id,
          phone: row.phone || undefined,
          hireDate: new Date(row.hiredate || Date.now()),
          managerId: row.managerid ? parseInt(row.managerid) : undefined,
        });

        // Create leave balances
        for (const lt of leaveTypes) {
          await LeaveBalance.create({
            employeeId: employee.id,
            leaveTypeId: lt.id,
            allocated: lt.defaultDays,
            used: 0,
            remaining: lt.defaultDays,
            year: currentYear,
          });
        }

        imported.push({ row: i + 1, employeeId: empId, email: row.email });
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    // Clean up uploaded file
    try { fs.unlinkSync(csvFile.path); } catch {}

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'bulk_import',
      entity: 'employee',
      details: `Bulk imported ${imported.length} employees. ${errors.length} errors.`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: `Imported ${imported.length} employees successfully.`,
      imported: imported.length,
      errors: errors.length > 0 ? errors.slice(0, 20) : [],
      defaultPassword: password,
    });
  } catch (error) {
    logger.error('Bulk import error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to import employees.' });
  }
};

// PATCH /api/employees/:id/toggle-status
export const toggleEmployeeStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!employee || employee.deletedAt) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const empUser = employee.get('user') as { isActive: boolean; update: (data: Record<string, unknown>) => Promise<void> } | undefined;
    if (!empUser) {
      res.status(400).json({ message: 'No user account linked.' });
      return;
    }

    const currentStatus = empUser.isActive;
    await empUser.update({ isActive: !currentStatus });
    res.json({
      message: `Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      isActive: !currentStatus,
    });
  } catch (error) {
    logger.error('Toggle status error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to toggle status.' });
  }
};

// POST /api/employees/:id/reset-password
export const resetEmployeePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!employee) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const empUser = employee.get('user') as { update: (data: Record<string, unknown>) => Promise<void> } | undefined;
    if (!empUser) {
      res.status(404).json({ message: 'Employee not found.' });
      return;
    }

    const crypto = require('crypto');
    const newPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await empUser.update({ password: hashedPassword });

    res.json({ message: `Password reset successfully. Temporary password: ${newPassword}` });
  } catch (error) {
    logger.error('Reset password error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};

// PATCH /api/employees/signature
export const updateSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { signature } = req.body;

    if (!signature || typeof signature !== 'string') {
      res.status(400).json({ message: 'Signature image data is required.' });
      return;
    }

    if (!signature.startsWith('data:image/')) {
      res.status(400).json({ message: 'Invalid signature format. Must be a base64 image.' });
      return;
    }

    // Max 500KB for signature image
    const sizeInBytes = Math.ceil((signature.length * 3) / 4);
    if (sizeInBytes > 500 * 1024) {
      res.status(400).json({ message: 'Signature image must be under 500KB.' });
      return;
    }

    const employee = await Employee.findOne({ where: { userId: req.user!.userId } });
    if (!employee) {
      res.status(404).json({ message: 'Employee profile not found.' });
      return;
    }

    await employee.update({ signature });

    res.json({
      message: 'Signature updated successfully.',
      signature: employee.signature,
    });
  } catch (error) {
    logger.error('Update signature error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update signature.' });
  }
};
