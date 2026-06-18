import { Request, Response, NextFunction } from 'express';
import { logger, generateRequestId } from '../utils/logger';

/**
 * Structured request logging middleware.
 * Logs every HTTP request with method, URL, status code, duration, IP, and user-agent.
 * Attaches a unique requestId to each request for distributed tracing.
 */
export interface LoggedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

export function structuredLogger(req: LoggedRequest, res: Response, next: NextFunction): void {
  // Attach request ID for tracing
  req.requestId = generateRequestId();
  req.startTime = Date.now();

  // Log request on arrival (debug level)
  logger.debug('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'] || 'unknown',
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      contentLength: res.getHeader('content-length') || 0,
    });
  });

  next();
}
