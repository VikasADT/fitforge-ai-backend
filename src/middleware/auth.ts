import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma/client';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
