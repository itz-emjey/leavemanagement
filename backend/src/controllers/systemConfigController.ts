import { Response } from 'express';
import { SystemConfig, LeaveRequest } from '../models';
import { AuthRequest } from '../middleware/auth';
import sequelize from '../config/database';
import { logger } from '../utils/logger';

/** Default system configuration values. */
const DEFAULT_CONFIGS = [
  { key: 'company_name', value: 'My Company', type: 'string', group: 'general', description: 'Company name displayed on reports and emails' },
  { key: 'leave_year_start_month', value: '1', type: 'number', group: 'leave', description: 'Month when the leave year starts (1=January)' },
  { key: 'working_days_per_week', value: '5', type: 'number', group: 'leave', description: 'Number of working days per week' },
  { key: 'default_carry_over_limit', value: '5', type: 'number', group: 'leave', description: 'Maximum leave days that can be carried over to next year' },
  { key: 'max_consecutive_leave_days', value: '30', type: 'number', group: 'leave', description: 'Maximum consecutive days an employee can take leave' },
  { key: 'auto_approve_manager_leaves', value: 'false', type: 'boolean', group: 'leave', description: 'Auto-approve leave requests from managers' },
  { key: 'approval_levels', value: '1', type: 'number', group: 'leave', description: 'Number of approval levels required (1=single, 2=multi-level)' },
  { key: 'enable_email_notifications', value: 'true', type: 'boolean', group: 'email', description: 'Send email notifications for leave events' },
  { key: 'sender_email', value: 'noreply@company.com', type: 'string', group: 'email', description: 'Sender email address for notifications' },
  { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'system', description: 'Enable maintenance mode (blocks non-admin access)' },
  { key: 'app_version', value: '1.0.0', type: 'string', group: 'system', description: 'Application version' },
];

// GET /api/system-config
export const getSystemConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const configs = await SystemConfig.findAll({ order: [['group', 'ASC'], ['key', 'ASC']] });
    const formatted: Record<string, any> = {};
    const byGroup: Record<string, any[]> = {};

    for (const cfg of configs) {
      let parsedValue: any = cfg.value;
      if (cfg.type === 'number') parsedValue = Number(cfg.value);
      else if (cfg.type === 'boolean') parsedValue = cfg.value === 'true';
      else if (cfg.type === 'json') { try { parsedValue = JSON.parse(cfg.value); } catch {} }

      formatted[cfg.key] = parsedValue;

      if (!byGroup[cfg.group]) byGroup[cfg.group] = [];
      byGroup[cfg.group].push({
        key: cfg.key,
        value: parsedValue,
        rawValue: cfg.value,
        type: cfg.type,
        description: cfg.description,
        group: cfg.group,
        updatedAt: cfg.updatedAt,
      });
    }

    res.json({ configs: formatted, byGroup });
  } catch (error) {
    logger.error('Get system config error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to load system configuration.' });
  }
};

// PUT /api/system-config
export const updateSystemConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body.configs as Record<string, string>;
    if (!updates || typeof updates !== 'object') {
      res.status(400).json({ message: 'Invalid config payload. Expected { configs: { key: value, ... } }' });
      return;
    }

    const updatedKeys: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const existing = await SystemConfig.findOne({ where: { key } });
      if (existing) {
        await existing.update({ value: String(value) });
        updatedKeys.push(key);
      }
    }

    res.json({ message: 'Configuration updated.', updatedKeys });
  } catch (error) {
    logger.error('Update system config error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to update system configuration.' });
  }
};

// POST /api/system-config/reset
export const resetSystemConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Upsert all default configs
    for (const cfg of DEFAULT_CONFIGS) {
      await SystemConfig.upsert({
        key: cfg.key,
        value: cfg.value,
        type: cfg.type as 'string' | 'number' | 'boolean' | 'json',
        group: cfg.group as 'general' | 'leave' | 'email' | 'system',
        description: cfg.description,
      });
    }

    res.json({ message: 'Configuration reset to defaults.' });
  } catch (error) {
    logger.error('Reset system config error:', { error: (error as Error).message });
    res.status(500).json({ message: 'Failed to reset configuration.' });
  }
};

// GET /api/system-config/health
export const getSystemHealth = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();

    // Test database connection
    await sequelize.authenticate();
    const dbLatency = Date.now() - startTime;

    // Get config count
    const configCount = await SystemConfig.count();

    const leaveCount = await LeaveRequest.count();

    res.json({
      status: 'healthy',
      database: {
        connected: true,
        latencyMs: dbLatency,
      },
      configCount,
      totalLeaveRequests: leaveCount,
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: { connected: false },
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
};
