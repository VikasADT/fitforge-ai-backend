import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as businessService from '../services/businessService';

export const getPublicWebsite = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const business = await businessService.getBusinessBySubdomain(subdomain);
  if (!business || !business.isActive) {
    return fail(res, 'Website not found', 404);
  }

  const websiteContent = business.websiteContent
    ? (business.websiteContent as {
        heroTitle: string;
        heroSubtitle: string;
        aboutText: string;
        services: any[];
        features: any[];
        testimonials: any[];
        seoTitle?: string;
        seoDescription?: string;
      })
    : {
        heroTitle: business.heroTitle,
        heroSubtitle: business.heroSubtitle,
        aboutText: business.aboutText,
        services: business.services ?? [],
        features: business.features ?? [],
        testimonials: business.testimonials ?? [],
        seoTitle: business.seoTitle ?? '',
        seoDescription: business.seoDescription ?? ''
      };

  if (!websiteContent || !websiteContent.heroTitle) {
    return fail(res, 'Website content not available', 404);
  }

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
    websiteContent,
    seoTitle: business.seoTitle ?? websiteContent.seoTitle,
    seoDescription: business.seoDescription ?? websiteContent.seoDescription,
    createdAt: business.createdAt
  };

  return success(res, 'Public website data fetched', { website: websitePayload });
});
