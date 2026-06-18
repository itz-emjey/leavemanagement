import { v4 as uuidv4 } from 'uuid';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(defaultMeta: Record<string, unknown>): Logger;
}

export const logger: Logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },

  /**
   * Create a child logger with bound default metadata (e.g. requestId).
   */
  child(defaultMeta: Record<string, unknown>): typeof logger {
    const childLogger = { ...logger };
    const originalDebug = childLogger.debug;
    const originalInfo = childLogger.info;
    const originalWarn = childLogger.warn;
    const originalError = childLogger.error;

    childLogger.debug = (message: string, meta?: Record<string, unknown>) =>
      originalDebug(message, { ...defaultMeta, ...meta });
    childLogger.info = (message: string, meta?: Record<string, unknown>) =>
      originalInfo(message, { ...defaultMeta, ...meta });
    childLogger.warn = (message: string, meta?: Record<string, unknown>) =>
      originalWarn(message, { ...defaultMeta, ...meta });
    childLogger.error = (message: string, meta?: Record<string, unknown>) =>
      originalError(message, { ...defaultMeta, ...meta });

    return childLogger;
  },
};

/**
 * Generate a unique request ID for tracing requests across the system.
 */
export function generateRequestId(): string {
  return uuidv4().slice(0, 8);
}
