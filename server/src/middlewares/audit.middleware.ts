import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Creates an audit log entry for critical actions (e.g. applications, approvals, status updates)
 */
export function auditLogger(action: string, entityName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Record request metadata for audit logging
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userId = req.user?.userId || null;

    // Attach audit helper to response locals
    res.locals.auditInfo = {
      action,
      entityName,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    next();
  };
}
