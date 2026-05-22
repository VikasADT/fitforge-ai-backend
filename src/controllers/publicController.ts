import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as businessService from '../services/businessService';
import * as mediaService from '../services/mediaService';
import { config } from '../config';

export const getPublicWebsite = asyncHandler(async (req: Request, res: Response) => {
  const { subdomain } = req.params;
  const business = await businessService.getPublishedBusinessBySubdomain(subdomain);
  if (!business || !business.isActive || !business.isPublished) {
    return fail(res, 'Website not found', 404);
  }

  const websiteContent = business.websiteContent && typeof business.websiteContent === 'object'
    ? (business.websiteContent as {
        heroTitle?: string;
        heroSubtitle?: string;
        aboutText?: string;
        services?: any[];
        features?: any[];
        testimonials?: any[];
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
        seoTitle: business.seoTitle ?? null,
        seoDescription: business.seoDescription ?? null
      };

  if (!websiteContent || !(websiteContent.heroTitle || business.heroTitle)) {
    return fail(res, 'Website content not available', 404);
  }

  const visitorId = req.headers['x-visitor-id'] as string | undefined;
  await businessService.incrementWebsiteViews(business.id, visitorId);

  const media = await mediaService.getBusinessMedia(business.id);
  const heroImage = media?.find((item: any) => item.type === 'HERO')?.url ?? null;
  const galleryImages = media
    ? media.filter((item: any) => item.type === 'GALLERY').map((item: any) => ({ url: item.url, altText: item.altText ?? null }))
    : [];

  const seoTitle = business.seoTitle ?? websiteContent.seoTitle ?? null;
  const seoDescription = business.seoDescription ?? websiteContent.seoDescription ?? null;
  const canonicalUrl = business.customDomain
    ? `https://${business.customDomain}`
    : `https://${business.subdomain}.${config.publicWebsiteDomain}`;

  const websitePayload = {
    businessName: business.businessName,
    category: business.category ?? null,
    city: business.city ?? null,
    phone: business.phone ?? null,
    logoUrl: business.logoUrl ?? null,
    subdomain: business.subdomain,
    customDomain: business.customDomain ?? null,
    url: canonicalUrl,
    templateId: business.templateId,
    themeColor: business.themeColor ?? null,
    fontStyle: business.fontStyle ?? null,
    whatsapp: {
      enabled: business.whatsappEnabled ?? false,
      number: business.whatsappEnabled && business.whatsappNumber ? business.whatsappNumber : null
    },
    ctaLabels: business.ctaLabels ?? null,
    websiteContent: {
      heroTitle: websiteContent.heroTitle ?? business.heroTitle ?? null,
      heroSubtitle: websiteContent.heroSubtitle ?? business.heroSubtitle ?? null,
      aboutText: websiteContent.aboutText ?? business.aboutText ?? null,
      services: websiteContent.services ?? business.services ?? [],
      features: websiteContent.features ?? business.features ?? [],
      testimonials: websiteContent.testimonials ?? business.testimonials ?? []
    },
    heroImage,
    galleryImages,
    memberships: business.membershipPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      description: plan.description,
      features: plan.features ?? [],
      isPopular: plan.isPopular
    })),
    seo: {
      title: seoTitle,
      description: seoDescription,
      openGraphImage: heroImage || business.logoUrl || (galleryImages[0]?.url ?? null),
      canonicalUrl,
      publishedAt: business.publishedAt ?? null
    },
    publishedAt: business.publishedAt,
    createdAt: business.createdAt
  };

  return success(res, 'Public website data fetched', { website: websitePayload });
});
