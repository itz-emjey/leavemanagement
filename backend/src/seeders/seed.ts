import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import '../models/index';
import { Role, Department, User, Employee, LeaveType, LeaveBalance, Permission } from '../models';
import { logger } from '../utils/logger';

const seed = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected.');

    await sequelize.sync({ alter: true });
    logger.info('Tables synced.');

    // Roles
    const roles = await Role.bulkCreate([
      { name: 'admin', description: 'System Administrator' },
      { name: 'manager', description: 'Department Manager' },
      { name: 'employee', description: 'Regular Employee' },
    ]);
    logger.info('Roles seeded.');

    // Departments
    const departments = await Department.bulkCreate([
      { name: 'Engineering', description: 'Software Engineering Department' },
      { name: 'Human Resources', description: 'HR Department' },
      { name: 'Finance', description: 'Finance and Accounting' },
      { name: 'Marketing', description: 'Marketing and Communications' },
      { name: 'Operations', description: 'Operations Management' },
    ]);
    logger.info('Departments seeded.');

    // Leave Types
    const leaveTypes = await LeaveType.bulkCreate([
      { name: 'Annual Leave', description: 'Yearly paid vacation leave', defaultDays: 12, color: '#3B82F6' },
      { name: 'Sick Leave', description: 'Medical and health-related leave', defaultDays: 14, color: '#EF4444' },
      { name: 'Personal Leave', description: 'Personal matters leave', defaultDays: 5, color: '#F59E0B' },
      { name: 'Maternity Leave', description: 'Maternity leave', defaultDays: 90, color: '#EC4899' },
      { name: 'Paternity Leave', description: 'Paternity leave', defaultDays: 7, color: '#8B5CF6' },
    ]);
    logger.info('Leave types seeded.');

    // Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      email: 'admin@company.com',
      password: hashedPassword,
      roleId: roles[0].id,
    });

    const adminEmployee = await Employee.create({
      userId: adminUser.id,
      employeeId: 'EMP-0001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@company.com',
      position: 'System Administrator',
      departmentId: departments[1].id, // HR
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
    await Permission.bulkCreate(permissions);
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
