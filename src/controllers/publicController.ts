import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as businessService from '../services/businessService';

export const getPublicWebsite = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const business = await businessService.getBusinessBySubdomain(subdomain);
  if (!business) return fail(res, 'Website not found', 404);

  const websitePayload = {
    businessName: business.businessName,
    category: business.category,
    city: business.city,
    phone: business.phone,
    logoUrl: business.logoUrl,
    subdomain: business.subdomain,
    templateId: business.templateId,
    themeColor: business.themeColor,
    fontStyle: business.fontStyle,
    websiteContent: business.websiteContent,
    seoTitle: business.seoTitle,
    seoDescription: business.seoDescription,
    createdAt: business.createdAt
  };

  return success(res, 'Public website data fetched', { website: websitePayload });
});
