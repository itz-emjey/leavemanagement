import { Response } from 'express';
import { Op } from 'sequelize';
import { AuditLog, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { logger } from '../utils/logger';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = parsePagination(req.query.page as string, req.query.limit as string);
    const action = req.query.action as string;
    const entity = req.query.entity as string;
    const search = req.query.search as string;

    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate) where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(endDate + 'T23:59:59.999Z') };

    const userWhere: any = {};
    if (search) {
      userWhere.email = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User, as: 'user',
          where: Object.keys(userWhere).length ? userWhere : undefined,
          attributes: ['id', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      logs: rows,
      pagination: buildPaginationMeta(count, page, limit),
    });
  } catch (error) {
    logger.error('Get audit logs error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch audit logs.' });
  }
};

export const getAuditLogActions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actions = await AuditLog.findAll({
      attributes: ['action'],
      group: ['action'],
      raw: true,
    });
    res.json(actions.map((a: any) => a.action));
  } catch (error) {
    logger.error('Get audit actions error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch audit actions.' });
  }
};

// GET /api/audit-logs/export
export const exportAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const action = req.query.action as string;
    const entity = req.query.entity as string;
    const search = req.query.search as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate) where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(startDate) };
    if (endDate) where.createdAt = { ...(where.createdAt || {}), [Op.lte]: new Date(endDate + 'T23:59:59.999Z') };

    const userWhere: any = {};
    if (search) {
      userWhere.email = { [Op.like]: `%${search}%` };
    }

    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User, as: 'user',
          where: Object.keys(userWhere).length ? userWhere : undefined,
          attributes: ['id', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const rows: string[] = [];
    rows.push('Timestamp,User,Action,Entity,Entity ID,Details,IP Address');
    logs.forEach((log: any) => {
      rows.push([
        new Date(log.createdAt).toISOString(),
        log.user?.email || 'System',
        log.action,
        log.entity,
        log.entityId || '',
        (log.details || '').replace(/,/g, ';'),
        log.ipAddress || '',
      ].join(','));
    });

    const csvContent = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    logger.error('Export audit logs error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to export audit logs.' });
  }
};
