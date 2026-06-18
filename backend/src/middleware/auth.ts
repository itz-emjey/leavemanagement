import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Read token from httpOnly cookie first, then fall back to Bearer header
    let token: string | undefined;

    if (req.cookies?.token) {
      token = req.cookies.token;
    } else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      res.status(401).json({ message: 'Access denied. No token provided.' });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * CSRF protection middleware.
 * Checks for X-Requested-With header to ensure the request is from the SPA.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Only check state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const requestedWith = req.headers['x-requested-with'];
    if (requestedWith !== 'XMLHttpRequest') {
      res.status(403).json({ message: 'CSRF validation failed.' });
      return;
    }
  }
  next();
};
