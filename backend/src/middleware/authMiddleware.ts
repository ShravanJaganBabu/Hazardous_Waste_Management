import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
  userRole?: UserRole;
}

// Fallback demo user profiles
const DEMO_USERS_MAP: Record<string, any> = {
  ADMIN: {
    userId: 'HZU-001',
    name: 'Harinitha (Admin)',
    username: 'harinitha_admin',
    email: 'harinitha.admin@haztrack.eec.edu',
    role: 'ADMIN',
    organizationName: 'HazTrack Central Control & Compliance (EEC)',
    status: 'ACTIVE',
    phone: '+91 94440 88901',
    activeSessions: 1,
    failedAttempts: 0,
  },
  LABORATORY: {
    userId: 'HZU-002',
    name: 'Rinitha (Lab Generator)',
    username: 'rinitha_lab',
    email: 'rinitha@apexresearch.org',
    role: 'LABORATORY',
    organizationName: 'Apex Chemical R&D Labs',
    status: 'ACTIVE',
    phone: '+91 94440 88902',
    activeSessions: 1,
    failedAttempts: 0,
  },
  INDUSTRY: {
    userId: 'HZU-003',
    name: 'Harini (Industry Generator)',
    username: 'harini_industry',
    email: 'harini@titanpetro.com',
    role: 'INDUSTRY',
    organizationName: 'Titan Petrochemicals Ltd.',
    status: 'ACTIVE',
    phone: '+91 94440 88903',
    activeSessions: 1,
    failedAttempts: 0,
  },
  TRANSPORTER: {
    userId: 'HZU-004',
    name: 'Rini (Hazmat Transporter)',
    username: 'rini_transporter',
    email: 'rini@ecohaul.in',
    role: 'TRANSPORTER',
    organizationName: 'EcoHaul Hazmat Transport Logistics',
    status: 'ACTIVE',
    phone: '+91 94440 88904',
    activeSessions: 1,
    failedAttempts: 0,
  },
  TREATMENT_FACILITY: {
    userId: 'HZU-006',
    name: 'Ravan (Facility Manager)',
    username: 'ravan_facility',
    email: 'ravan@greensafe.in',
    role: 'TREATMENT_FACILITY',
    organizationName: 'GreenSafe Neutralization & Recovery Plant',
    status: 'ACTIVE',
    phone: '+91 94440 88906',
    activeSessions: 1,
    failedAttempts: 0,
  },
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Standard JWT verification if token is present
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token !== 'DEMO_TOKEN' && token !== 'DEMO_JWT_SESSION_ACTIVE') {
        try {
          const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string; role: UserRole };
          const user = await User.findOne({ userId: decoded.userId }).exec();

          if (user) {
            if (user.status !== 'ACTIVE' && !ENV.DEMO_MODE) {
              res.status(403).json({
                success: false,
                message: 'User account is inactive or suspended.',
              });
              return;
            }
            req.user = user;
            req.userRole = user.role;
            return next();
          }
        } catch (jwtErr) {
          // In DEMO_MODE, gracefully fall through to demo user resolution
          if (!ENV.DEMO_MODE) {
            res.status(401).json({
              success: false,
              message: 'Invalid or expired session token.',
            });
            return;
          }
        }
      }
    }

    // DEMO MODE BYPASS: If demo mode is active, authenticate automatically
    if (ENV.DEMO_MODE) {
      const reqRole = (req.headers['x-demo-role'] as string) || 'ADMIN';
      const reqUserId = (req.headers['x-demo-userid'] as string);

      let user = null;
      if (reqUserId) {
        user = await User.findOne({ userId: reqUserId }).exec();
      }
      if (!user && reqRole) {
        user = await User.findOne({ role: reqRole as UserRole }).exec();
      }

      // If DB has no matching user, use mock demo profile
      if (!user) {
        const fallback = DEMO_USERS_MAP[reqRole] || DEMO_USERS_MAP.ADMIN;
        user = new User(fallback);
      }

      req.user = user;
      req.userRole = user.role;
      return next();
    }

    // Production mode without DEMO_MODE: strict rejection
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  } catch (error: any) {
    if (ENV.DEMO_MODE) {
      const fallback = DEMO_USERS_MAP.ADMIN;
      req.user = new User(fallback);
      req.userRole = 'ADMIN';
      return next();
    }
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.',
    });
  }
};

export const authorizeRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // In DEMO_MODE, allow access across all demo roles
    if (ENV.DEMO_MODE) {
      return next();
    }

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] permission role.`,
      });
      return;
    }
    next();
  };
};
