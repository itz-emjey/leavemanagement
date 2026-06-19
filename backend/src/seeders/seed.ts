import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import '../models/index';
import { Role, Department, User, Employee, LeaveType, LeaveBalance, Permission } from '../models';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';

const seed = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected.');

    await sequelize.sync({ alter: true });
    logger.info('Tables synced.');

    // Check if already seeded
    const existingAdmin = await User.findOne({ where: { email: 'admin@company.com' } });
    if (existingAdmin) {
      logger.info('Database already seeded. Skipping.');
      process.exit(0);
    }

    // Roles
    const [adminRole] = await Role.findOrCreate({ where: { name: 'admin' }, defaults: { name: 'admin', description: 'System Administrator' } });
    const [managerRole] = await Role.findOrCreate({ where: { name: 'manager' }, defaults: { name: 'manager', description: 'Department Manager' } });
    const [employeeRole] = await Role.findOrCreate({ where: { name: 'employee' }, defaults: { name: 'employee', description: 'Regular Employee' } });
    const roles = [adminRole, managerRole, employeeRole];
    logger.info('Roles seeded.');

    // Departments
    const [engDept] = await Department.findOrCreate({ where: { name: 'Engineering' }, defaults: { name: 'Engineering', description: 'Software Engineering Department' } });
    const [hrDept] = await Department.findOrCreate({ where: { name: 'Human Resources' }, defaults: { name: 'Human Resources', description: 'HR Department' } });
    const [finDept] = await Department.findOrCreate({ where: { name: 'Finance' }, defaults: { name: 'Finance', description: 'Finance and Accounting' } });
    const [mktDept] = await Department.findOrCreate({ where: { name: 'Marketing' }, defaults: { name: 'Marketing', description: 'Marketing and Communications' } });
    const [opsDept] = await Department.findOrCreate({ where: { name: 'Operations' }, defaults: { name: 'Operations', description: 'Operations Management' } });
    const departments = [engDept, hrDept, finDept, mktDept, opsDept];
    logger.info('Departments seeded.');

    // Leave Types
    const annualLT = await LeaveType.findOrCreate({ where: { name: 'Annual Leave' }, defaults: { name: 'Annual Leave', description: 'Yearly paid vacation leave', defaultDays: 12, color: '#3B82F6' } }).then(r => r[0]);
    const sickLT = await LeaveType.findOrCreate({ where: { name: 'Sick Leave' }, defaults: { name: 'Sick Leave', description: 'Medical and health-related leave', defaultDays: 14, color: '#EF4444' } }).then(r => r[0]);
    const personalLT = await LeaveType.findOrCreate({ where: { name: 'Personal Leave' }, defaults: { name: 'Personal Leave', description: 'Personal matters leave', defaultDays: 5, color: '#F59E0B' } }).then(r => r[0]);
    const maternityLT = await LeaveType.findOrCreate({ where: { name: 'Maternity Leave' }, defaults: { name: 'Maternity Leave', description: 'Maternity leave', defaultDays: 90, color: '#EC4899' } }).then(r => r[0]);
    const paternityLT = await LeaveType.findOrCreate({ where: { name: 'Paternity Leave' }, defaults: { name: 'Paternity Leave', description: 'Paternity leave', defaultDays: 7, color: '#8B5CF6' } }).then(r => r[0]);
    const leaveTypes = [annualLT, sickLT, personalLT, maternityLT, paternityLT];
    logger.info('Leave types seeded.');

    // Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      email: 'admin@company.com',
      password: hashedPassword,
      roleId: adminRole.id,
    });

    const adminEmployee = await Employee.create({
      userId: adminUser.id,
      employeeId: 'EMP-0001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@company.com',
      position: 'System Administrator',
      departmentId: hrDept.id,
      hireDate: new Date('2024-01-01'),
    });
    logger.info('Admin user seeded.');

    // Create leave balances for admin
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await LeaveBalance.create({
        employeeId: adminEmployee.id,
        leaveTypeId: lt.id,
        allocated: lt.defaultDays,
        used: 0,
        remaining: lt.defaultDays,
        year: currentYear,
      });
    }
    logger.info('Admin leave balances seeded.');

    // Default permissions
    const permissionDefs: { resource: string; actions: string[] }[] = [
      { resource: 'leave_requests', actions: ['create', 'read', 'approve', 'reject', 'cancel'] },
      { resource: 'employees', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'leave_types', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'departments', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'holidays', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'leave_policies', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'leave_credits', actions: ['read', 'adjust', 'carry_over'] },
      { resource: 'reports', actions: ['read', 'export'] },
      { resource: 'audit_logs', actions: ['read', 'export'] },
      { resource: 'settings', actions: ['read', 'configure'] },
    ];

    const defaultRolePermissions: Record<string, string[]> = {
      admin: permissionDefs.flatMap((r) => r.actions.map((a) => `${r.resource}:${a}`)),
      manager: [
        'leave_requests:create', 'leave_requests:read', 'leave_requests:approve', 'leave_requests:reject',
        'employees:read',
        'reports:read', 'reports:export',
        'settings:read',
      ],
      employee: [
        'leave_requests:create', 'leave_requests:read', 'leave_requests:cancel',
        'reports:read',
        'settings:read',
      ],
    };

    const permissions: { roleId: number; resource: string; action: string; allowed: boolean }[] = [];
    for (const role of roles) {
      const allowedKeys = defaultRolePermissions[role.name] || [];
      for (const { resource, actions } of permissionDefs) {
        for (const action of actions) {
          permissions.push({
            roleId: role.id,
            resource,
            action,
            allowed: allowedKeys.includes(`${resource}:${action}`),
          });
        }
      }
    }
    await Permission.bulkCreate(permissions, { ignoreDuplicates: true });
    logger.info('Default permissions seeded.');

    logger.info('Seeding complete!');
    logger.info('Admin login: admin@company.com / admin123');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', { error: (error as Error).message });
    process.exit(1);
  }
};

seed();
