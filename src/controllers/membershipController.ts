import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as membershipService from '../services/membershipService';
import { AuthRequest } from '../middleware/auth';

export const getMemberships = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const { id } = req.params;
  const memberships = await membershipService.getMembershipsForBusiness(id, req.user.id);
  if (memberships === null) return fail(res, 'Business not found', 404);

  return success(res, 'Memberships fetched', { memberships });
});

export const createMembership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const { id } = req.params;
  const payload = { businessId: id, ...req.body };
  const membership = await membershipService.createMembership(payload, req.user.id);
  if (!membership) return fail(res, 'Business not found', 404);

  return success(res, 'Membership created', membership, 201);
});

export const updateMembership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const { id } = req.params;
  const membership = await membershipService.updateMembership(id, req.user.id, req.body);
  if (!membership) return fail(res, 'Membership not found', 404);

  return success(res, 'Membership updated', membership);
});

export const deleteMembership = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const { id } = req.params;
  const removed = await membershipService.deleteMembership(id, req.user.id);
  if (!removed) return fail(res, 'Membership not found', 404);

  return success(res, 'Membership deleted');
});
