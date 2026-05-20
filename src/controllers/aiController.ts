import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as aiService from '../ai/generateGymContent';
import * as businessService from '../services/businessService';
import { AuthRequest } from '../middleware/auth';
import { WebsiteContent } from '../types/website';

export const generateContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { businessName, city, services, templateId, themeColor, fontStyle, category, logoUrl, phone, subdomain } = req.body;
  if (!businessName || !services || !Array.isArray(services) || services.length === 0) {
    return fail(res, 'Missing required fields', 400);
  }
  if (!req.user) return fail(res, 'Unauthorized', 401);

  const content: WebsiteContent = await aiService.generateGymContent({
    businessName,
    city,
    services,
    templateId,
    themeColor,
    fontStyle
  });

  const userId = req.user.id;
  const business = await businessService.createBusiness({
    userId,
    businessName,
    category,
    city,
    phone,
    logoUrl,
    subdomain,
    heroTitle: content.heroTitle,
    heroSubtitle: content.heroSubtitle,
    aboutText: content.aboutText,
    services: content.services,
    features: content.features,
    testimonials: content.testimonials,
    websiteContent: content as any,
    seoTitle: content.seoTitle,
    seoDescription: content.seoDescription,
    templateId,
    themeColor,
    fontStyle
  });

  return success(res, 'Generated website content saved', { website: business }, 201);
});
