import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from './auth';

type RoleName = 'SUPER_ADMIN' | 'GYM_OWNER';

export const requireRole = (roles: RoleName | RoleName[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!dbUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

    if (!('role' in dbUser)) return res.status(403).json({ success: false, message: 'Forbidden' });

    if (!allowed.includes(dbUser.role as RoleName)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    next();
  };
};

export default requireRole;
