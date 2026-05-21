import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../prisma/client';
import { fail } from '../utils/response';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
  body: any;
  params: any;
  headers: any;
  file?: any;
  files?: any;
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
    return fail(res, 'Unauthorized', 401);
  }

  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (!payload || typeof payload.userId !== 'string') {
      return fail(res, 'Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return fail(res, 'Unauthorized', 401);
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (_error) {
    return fail(res, 'Unauthorized', 401);
  }
};
