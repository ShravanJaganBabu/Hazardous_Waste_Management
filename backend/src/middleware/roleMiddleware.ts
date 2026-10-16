import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { UserRole } from '../models/User.js';
import { ENV } from '../config/env.js';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {

    if (!req.user || !req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication is required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission to access this resource. Required role(s): ${allowedRoles.join(
          ', '
        )}`,
      });
      return;
    }

    next();
  };
};
