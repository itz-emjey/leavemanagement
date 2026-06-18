import { Response } from 'express';
import { Op } from 'sequelize';
import { Holiday, AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';
import { cacheWrap, cacheDelete, CacheKeys } from '../utils/cache';
import { logger } from '../utils/logger';

export const getHolidays = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const holidays = await cacheWrap(
      CacheKeys.HOLIDAYS(year),
      async () => {
        return await Holiday.findAll({
          where: {
            [Op.or]: [
              { date: { [Op.gte]: `${year}-01-01`, [Op.lte]: `${year}-12-31` } },
              { isRecurring: true },
            ],
          },
          order: [['date', 'ASC']],
        });
      },
      600, // 10 min TTL
    );

    res.json(holidays);
  } catch (error) {
    logger.error('Get holidays error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch holidays.' });
  }
};

export const createHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, date, isRecurring, type } = req.body;
    if (!name || !date) {
      res.status(400).json({ message: 'Name and date are required.' });
      return;
    }

    const existing = await Holiday.findOne({ where: { name, date } });
    if (existing) {
      res.status(400).json({ message: 'Holiday already exists on this date.' });
      return;
    }

    const holiday = await Holiday.create({ name, date, isRecurring: isRecurring || false, type: type || 'public' });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'create',
      entity: 'holiday',
      entityId: holiday.id,
      details: `Created holiday "${name}" on ${date}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Invalidate cache
    cacheDelete(CacheKeys.HOLIDAYS(new Date(date).getFullYear()));
    cacheDelete(CacheKeys.UPCOMING_HOLIDAYS);

    res.status(201).json(holiday);
  } catch (error) {
    logger.error('Create holiday error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to create holiday.' });
  }
};

export const updateHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) {
      res.status(404).json({ message: 'Holiday not found.' });
      return;
    }

    const { name, date, isRecurring, type } = req.body;
    await holiday.update({
      name: name || holiday.name,
      date: date || holiday.date,
      isRecurring: isRecurring !== undefined ? isRecurring : holiday.isRecurring,
      type: type || holiday.type,
    });

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'update',
      entity: 'holiday',
      entityId: holiday.id,
      details: `Updated holiday "${name || holiday.name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Invalidate all holiday caches
    cacheDelete(CacheKeys.UPCOMING_HOLIDAYS);
    const years = [new Date(holiday.date).getFullYear()];
    if (date) years.push(new Date(date).getFullYear());
    years.forEach(y => cacheDelete(CacheKeys.HOLIDAYS(y)));

    res.json(holiday);
  } catch (error) {
    logger.error('Update holiday error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update holiday.' });
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) {
      res.status(404).json({ message: 'Holiday not found.' });
      return;
    }
    const name = holiday.name;
    const year = new Date(holiday.date).getFullYear();
    await holiday.destroy();

    await AuditLog.create({
      userId: req.user!.userId,
      action: 'delete',
      entity: 'holiday',
      entityId: parseInt(req.params.id),
      details: `Deleted holiday "${name}"`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Invalidate cache
    cacheDelete(CacheKeys.HOLIDAYS(year));
    cacheDelete(CacheKeys.UPCOMING_HOLIDAYS);

    res.json({ message: 'Holiday deleted successfully.' });
  } catch (error) {
    logger.error('Delete holiday error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to delete holiday.' });
  }
};

export const getUpcomingHolidays = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const holidays = await cacheWrap(
      CacheKeys.UPCOMING_HOLIDAYS,
      async () => {
        const today = new Date().toISOString().split('T')[0];
        return await Holiday.findAll({
          where: { date: { [Op.gte]: today } },
          order: [['date', 'ASC']],
          limit: 5,
        });
      },
      600, // 10 min TTL
    );

    res.json(holidays);
  } catch (error) {
    logger.error('Get upcoming holidays error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch upcoming holidays.' });
  }
};
