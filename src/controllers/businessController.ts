import { Request, Response } from 'express';
import * as businessService from '../services/businessService';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const payload = req.body;
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const userId = req.user.id;
  const business = await businessService.createBusiness({ ...payload, userId });
  return success(res, 'Business created successfully', business, 201);
});

export const getBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const business = await businessService.getBusinessById(id);
  if (!business) return fail(res, 'Business not found', 404);
  return success(res, 'Business fetched', business);
});

export const updateBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const { id } = req.params;
  const updated = await businessService.updateBusiness(id, req.body);
  if (!updated) return fail(res, 'Business not found', 404);
  return success(res, 'Business updated', updated);
});

export const deleteBusiness = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const { id } = req.params;
  await businessService.deleteBusiness(id);
  return success(res, 'Business deleted');
});
