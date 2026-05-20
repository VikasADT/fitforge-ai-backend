import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const user = await authService.registerUser({ name, email, password });
    if (!user) return fail(res, 'Registration failed');
    return success(res, 'User registered', { user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const token = await authService.loginUser({ email, password });
    if (!token) return fail(res, 'Invalid credentials', 401);
    return success(res, 'Login successful', { token });
});

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return fail(res, 'Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return fail(res, 'User not found', 404);
    }

    return success(res, 'Current user fetched successfully', {
      user
    });
  }
);