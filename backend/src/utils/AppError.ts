import { Request, Response, NextFunction, RequestHandler } from 'express';
import { logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, string[]>;

  constructor(statusCode: number, message: string, code?: string, details?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: Record<string, string[]>) {
    return new AppError(400, message, 'VALIDATION_ERROR', details);
  }

  static notFound(message: string) {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static unauthorized(message: string = 'Authentication required.') {
    return new AppError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Access denied.') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static internal(message: string = 'Internal server error.') {
    return new AppError(500, message, 'INTERNAL_ERROR');
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Multer file size error
  if (err.message?.includes('File too large')) {
    res.status(400).json({
      message: 'File size exceeds the maximum limit.',
      code: 'FILE_TOO_LARGE',
    });
    return;
  }

  // Default: unexpected error
  res.status(500).json({
    message: 'Internal server error.',
    code: 'INTERNAL_ERROR',
  });
};

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
