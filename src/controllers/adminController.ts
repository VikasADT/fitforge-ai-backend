import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await adminService.listUsers();
  return success(res, 'Users fetched', { users });
});

export const getBusinesses = asyncHandler(async (_req: Request, res: Response) => {
  const businesses = await adminService.listBusinesses();
  return success(res, 'Businesses fetched', { businesses });
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await adminService.getAnalytics();
  return success(res, 'Analytics fetched', { analytics });
});

export const getSubscriptions = asyncHandler(async (_req: Request, res: Response) => {
  const subs = await adminService.listSubscriptions();
  return success(res, 'Subscriptions fetched', { subs });
});

export const patchBusinessStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body as { isActive: boolean };
  const updated = await adminService.updateBusinessStatus(id, Boolean(isActive));
  return success(res, 'Business status updated', { business: updated });
});

export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await adminService.deleteBusiness(id);
  return success(res, 'Business deleted');
});

export default {
  getUsers,
  getBusinesses,
  getAnalytics,
  getSubscriptions,
  patchBusinessStatus,
  deleteBusiness
};
