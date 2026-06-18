import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Permission from '../models/Permission';
import Role from '../models/Role';
import { logger } from '../utils/logger';

// Legacy role-name-based authorization
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};

// Resource/action-based authorization that queries the Permission model
// Usage: router.get('/', protect, authorizePermission('reports', 'read'), handler)
export const authorizePermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
      }

      // Admins bypass permission checks
      if (req.user.role === 'admin') {
        next();
        return;
      }

      const role = await Role.findOne({ where: { name: req.user.role } });
      if (!role) {
        res.status(403).json({ message: 'Access denied. Role not found.' });
        return;
      }

      const permission = await Permission.findOne({
        where: {
          roleId: role.id,
          resource,
          action,
          allowed: true,
        },
      });

      if (!permission) {
        res.status(403).json({
          message: `Access denied. Role "${req.user.role}" does not have "${action}" permission on "${resource}".`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', { error: (error as Error).message });
      res.status(500).json({ message: 'Failed to verify permissions.' });
    }
  };
};
