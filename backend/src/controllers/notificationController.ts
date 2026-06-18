import { Response } from 'express';
import { Notification } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

// GET /api/notifications
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user!.userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    logger.error('Get notifications error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, userId: req.user!.userId } }
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    logger.error('Mark read error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to mark as read.' });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user!.userId, isRead: false } }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    logger.error('Mark all read error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to mark all as read.' });
  }
};
