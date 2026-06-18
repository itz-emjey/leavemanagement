import { Response } from 'express';
import { Op } from 'sequelize';
import { Permission, Role, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// Pre-defined resource/action matrix
const DEFAULT_PERMISSIONS: { resource: string; actions: string[] }[] = [
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

// Default allowed roles per resource (admin gets all, rest get basic)
const DEFAULT_ROLE_ALLOWED: Record<string, string[]> = {
  admin: DEFAULT_PERMISSIONS.flatMap((r) => r.actions.map((a) => `${r.resource}:${a}`)),
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

// GET /api/permissions
export const getPermissions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    const permissions = await Permission.findAll({ order: [['resource', 'ASC'], ['action', 'ASC']] });

    // Build matrix: { resource: { action: { roleName: boolean } } }
    const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
    for (const perm of permissions) {
      const role = roles.find((r) => r.id === perm.roleId);
      if (!role) continue;
      if (!matrix[perm.resource]) matrix[perm.resource] = {};
      if (!matrix[perm.resource][perm.action]) matrix[perm.resource][perm.action] = {};
      matrix[perm.resource][perm.action][role.name] = perm.allowed;
    }

    res.json({
      roles: roles.map((r) => ({ id: r.id, name: r.name, description: r.description })),
      resources: DEFAULT_PERMISSIONS.map((r) => ({ resource: r.resource, actions: r.actions })),
      matrix,
    });
  } catch (error) {
    logger.error('Get permissions error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch permissions.' });
  }
};

// POST /api/permissions
export const updatePermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roleId, resource, action, allowed } = req.body;

    if (!roleId || !resource || !action || allowed === undefined) {
      res.status(400).json({ message: 'roleId, resource, action, and allowed are required.' });
      return;
    }

    const [permission] = await Permission.upsert({
      roleId,
      resource,
      action,
      allowed,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: allowed ? 'grant' : 'revoke',
      entity: 'permission',
      entityId: permission.id,
      details: `${allowed ? 'Granted' : 'Revoked'} ${resource}:${action} for role #${roleId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Permission updated successfully.', permission });
  } catch (error) {
    logger.error('Update permission error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update permission.' });
  }
};

// POST /api/permissions/reset
export const resetDefaultPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Delete all existing permissions
    await Permission.destroy({ where: {} });

    const roles = await Role.findAll();

    // Create default permissions for each role
    const permissions: { roleId: number; resource: string; action: string; allowed: boolean }[] = [];

    for (const role of roles) {
      const allowedKeys = DEFAULT_ROLE_ALLOWED[role.name] || [];

      for (const { resource, actions } of DEFAULT_PERMISSIONS) {
        for (const action of actions) {
          const key = `${resource}:${action}`;
          permissions.push({
            roleId: role.id,
            resource,
            action,
            allowed: allowedKeys.includes(key),
          });
        }
      }
    }

    await Permission.bulkCreate(permissions);

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'reset',
      entity: 'permission',
      details: 'Reset all permissions to defaults',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Permissions reset to defaults.', count: permissions.length });
  } catch (error) {
    logger.error('Reset permissions error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to reset permissions.' });
  }
};
