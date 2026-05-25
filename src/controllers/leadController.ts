import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as leadService from '../services/leadService';
import { AuthRequest } from '../middleware/auth';

export const createPublicLead = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const lead = await leadService.createPublicLead(subdomain, req.body);
  if (!lead) return fail(res, 'Website not available', 404);

  return success(res, 'Lead submitted successfully', lead, 201);
});

export const createMembershipInquiry = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const lead = await leadService.createMembershipInquiry(subdomain, req.body);
  if (!lead) return fail(res, 'Website not available', 404);

  return success(res, 'Membership inquiry submitted successfully', lead, 201);
});

export const trackPublicCta = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const ctaType = req.body.ctaType;
  const updated = await leadService.incrementCtaClicks(subdomain, ctaType);
  if (!updated) return fail(res, 'Website not available', 404);

  return success(res, 'CTA click tracked', { ctaClicks: updated.ctaClicks });
});

export const getBusinessLeads = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const { id } = req.params;
  const page = Number(req.query.page || 1);
  const limit = Math.min(100, Number(req.query.limit || 50));

  const result = await leadService.getLeadsForBusiness(id, req.user.id, page, limit);
  if (!result) return fail(res, 'Business not found', 404);

  return success(res, 'Leads fetched successfully', result);
});
