import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import * as activityService from './activityService';
import { config } from '../config';

export type PublishValidationResult = {
  ready: boolean;
  missing: string[];
  state: 'DRAFT' | 'READY' | 'PUBLISHED';
};

type BusinessValidationInput = {
  businessName?: string | null;
  subdomain?: string | null;
  heroTitle?: string | null;
  templateId?: string | null;
  services?: any;
  websiteContent?: any;
  isPublished?: boolean;
};

const normalizeJsonArray = (value: any) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [];
};

const getValidationValue = (business: BusinessValidationInput, field: string) => {
  const rootValue = (business as any)[field];
  if (rootValue) return rootValue;

  if (business.websiteContent && typeof business.websiteContent === 'object') {
    return (business.websiteContent as any)[field];
  }

  return undefined;
};

const getBusinessPublishValidation = (business: BusinessValidationInput): PublishValidationResult => {
  const businessName = String(getValidationValue(business, 'businessName') ?? '').trim();
  const subdomain = String(getValidationValue(business, 'subdomain') ?? '').trim();
  const heroTitle = String(getValidationValue(business, 'heroTitle') ?? '').trim();
  const templateId = String(getValidationValue(business, 'templateId') ?? '').trim();
  const servicesValue = getValidationValue(business, 'services');
  const services = normalizeJsonArray(servicesValue);

  const missing: string[] = [];
  if (!businessName) missing.push('businessName');
  if (!subdomain) missing.push('subdomain');
  if (!heroTitle) missing.push('heroTitle');
  if (!templateId) missing.push('templateId');
  if (!Array.isArray(services) || services.length === 0) missing.push('services');

  const ready = missing.length === 0;
  const state = business.isPublished ? 'PUBLISHED' : ready ? 'READY' : 'DRAFT';
  return { ready, missing, state };
};

export const validateBusinessPublishState = async (id: string) => {
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) {
    return null;
  }
  return getBusinessPublishValidation(business as BusinessValidationInput);
};

const buildPublicWebsiteUrl = (subdomain?: string | null, customDomain?: string | null) => {
  if (customDomain) {
    return `https://${customDomain}`;
  }
  if (!subdomain) {
    return '';
  }
  return `https://${subdomain}.${config.publicWebsiteDomain}`;
};

export type CreateBusinessPayload = {
  userId: string;
  businessName: string;
  category?: string;
  city?: string;
  phone?: string;
  logoUrl?: string;
  subdomain?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  aboutText?: string;
  services?: Prisma.InputJsonValue;
  features?: Prisma.InputJsonValue;
  testimonials?: Prisma.InputJsonValue;
  websiteContent?: Prisma.InputJsonValue;
  seoTitle?: string;
  seoDescription?: string;
  templateId?: string;
  themeColor?: string;
  fontStyle?: string;
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  ctaLabels?: Prisma.InputJsonValue;
};

export type UpdateBusinessPayload = Partial<Omit<CreateBusinessPayload, 'userId'>> & {
  isPublished?: boolean;
  publishedAt?: Date | null;
};

export const createBusiness = async (data: CreateBusinessPayload) => {
  if (data.subdomain) {
    const existing = await prisma.business.findUnique({
      where: { subdomain: data.subdomain }
    });

    if (existing) {
      return null;
    }
  }

  const publishValidation = getBusinessPublishValidation(data);

  return prisma.business.create({
    data: {
      userId: data.userId,
      businessName: data.businessName,
      category: data.category,
      city: data.city,
      phone: data.phone,
      logoUrl: data.logoUrl,
      subdomain: data.subdomain,
      heroTitle: data.heroTitle,
      heroSubtitle: data.heroSubtitle,
      aboutText: data.aboutText,
      services: data.services ? data.services : undefined,
      features: data.features ? data.features : undefined,
      testimonials: data.testimonials ? data.testimonials : undefined,
      websiteContent: data.websiteContent ? data.websiteContent : undefined,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      templateId: data.templateId,
      themeColor: data.themeColor,
      fontStyle: data.fontStyle,
      whatsappNumber: data.whatsappNumber,
      whatsappEnabled: data.whatsappEnabled,
      ctaLabels: data.ctaLabels ? data.ctaLabels : undefined,
      publishState: publishValidation.state
    }
  });
};

export const getBusinessById = async (id: string) => prisma.business.findUnique({ where: { id } });

export const getBusinessByIdForUser = async (id: string, userId: string) =>
  prisma.business.findFirst({ where: { id, userId } });

export const getBusinessBySubdomain = async (subdomain: string) =>
  prisma.business.findUnique({ where: { subdomain } });

export const getPublishedBusinessBySubdomain = async (subdomain: string) =>
  prisma.business.findUnique({
    where: { subdomain },
    include: {
      membershipPlans: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

export const incrementWebsiteViews = async (id: string, visitorId?: string) => {
  const updatedBusiness = prisma.business.update({
    where: { id },
    data: {
      websiteViews: {
        increment: 1
      }
    }
  });

  const activity = activityService.recordBusinessActivity(
    id,
    'WEBSITE_VIEWED',
    undefined,
    visitorId ? { visitorId } : undefined
  );

  const [business] = await prisma.$transaction([updatedBusiness, activity]);
  return business;
};

export const updateBusiness = async (
  id: string,
  userId: string,
  data: UpdateBusinessPayload
) => {
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business || business.userId !== userId) {
    return null;
  }

  if (data.subdomain && data.subdomain !== business.subdomain) {
    const existing = await prisma.business.findUnique({ where: { subdomain: data.subdomain } });
    if (existing) {
      const error: any = new Error('Subdomain already in use');
      error.status = 400;
      throw error;
    }
  }

  const mergedBusiness = {
    ...business,
    ...data
  };
  const publishValidation = getBusinessPublishValidation(mergedBusiness);
  const publishState = business.isPublished ? 'PUBLISHED' : publishValidation.state;

  const updated = await prisma.business.update({
    where: { id },
    data: {
      ...data,
      publishState,
      services: data.services === undefined ? undefined : data.services,
      features: data.features === undefined ? undefined : data.features,
      testimonials: data.testimonials === undefined ? undefined : data.testimonials,
      websiteContent: data.websiteContent === undefined ? undefined : data.websiteContent,
      ctaLabels: data.ctaLabels === undefined ? undefined : data.ctaLabels
    }
  });

  if (!business.isPublished && publishValidation.ready && business.publishState === 'DRAFT') {
    await activityService.recordBusinessActivity(id, 'CMS_COMPLETED', 'CMS completed and ready for publishing', {
      publishState: publishValidation.state,
      missing: publishValidation.missing
    });
  }

  return updated;
};

export const publishBusiness = async (id: string, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) {
    return null;
  }

  const validation = getBusinessPublishValidation(business);
  if (!validation.ready) {
    return { error: 'Business is not ready to publish', validation };
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: new Date(),
      publishState: 'PUBLISHED'
    }
  });

  await Promise.all([
    activityService.recordBusinessActivity(id, 'CMS_COMPLETED', 'CMS completed and published', {
      publishState: 'PUBLISHED',
      missing: validation.missing
    }),
    activityService.recordBusinessActivity(id, 'WEBSITE_PUBLISHED', 'Website published')
  ]);

  return {
    business: updated,
    url: buildPublicWebsiteUrl(updated.subdomain, updated.customDomain)
  };
};

export const unpublishBusiness = async (id: string, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) {
    return null;
  }

  const validation = getBusinessPublishValidation({ ...business, isPublished: false });

  const updated = await prisma.business.update({
    where: { id },
    data: {
      isPublished: false,
      publishedAt: null,
      publishState: validation.state
    }
  });

  await activityService.recordBusinessActivity(id, 'WEBSITE_UNPUBLISHED', 'Website unpublished');
  return updated;
};

export const getBusinessHealth = async (id: string, userId: string) => {
  const business = await prisma.business.findFirst({
    where: { id, userId },
    select: {
      id: true,
      businessName: true,
      subdomain: true,
      heroTitle: true,
      templateId: true,
      services: true,
      websiteContent: true,
      seoTitle: true,
      seoDescription: true,
      logoUrl: true,
      themeColor: true,
      fontStyle: true,
      isPublished: true,
      publishState: true,
      publishedAt: true,
      updatedAt: true
    }
  });

  if (!business) {
    return null;
  }

  const validation = getBusinessPublishValidation(business);
  const [heroImages, galleryImages, membershipPlans] = await Promise.all([
    prisma.businessMedia.count({ where: { businessId: id, type: 'HERO' as any } }),
    prisma.businessMedia.count({ where: { businessId: id, type: 'GALLERY' as any } }),
    prisma.membershipPlan.count({ where: { businessId: id } })
  ]);

  const mediaComplete = heroImages > 0 || Boolean(business.logoUrl);
  const seoComplete = Boolean(business.seoTitle && business.seoDescription);
  const brandingComplete = Boolean(business.logoUrl && business.themeColor && business.fontStyle);

  const score = Math.max(
    0,
    100 - validation.missing.length * 16 - (mediaComplete ? 0 : 10) - (seoComplete ? 0 : 10) - (brandingComplete ? 0 : 10)
  );

  return {
    ready: validation.ready,
    missing: validation.missing,
    score,
    mediaCompleteness: {
      heroImages,
      galleryImages,
      totalMedia: heroImages + galleryImages
    },
    seoCompleteness: {
      hasSeoTitle: Boolean(business.seoTitle),
      hasSeoDescription: Boolean(business.seoDescription),
      seoComplete
    },
    brandingCompleteness: {
      logoUrl: Boolean(business.logoUrl),
      themeColor: Boolean(business.themeColor),
      fontStyle: Boolean(business.fontStyle),
      brandingComplete
    },
    membershipCount: membershipPlans,
    publishState: business.publishState,
    isPublished: business.isPublished,
    publishedAt: business.publishedAt,
    updatedAt: business.updatedAt
  };
};

export const getBusinessAnalytics = async (id: string, userId: string) => {
  return prisma.business.findFirst({
    where: { id, userId },
    select: {
      websiteViews: true,
      leadCount: true,
      ctaClicks: true,
      isPublished: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

export const getUserBusinesses = async (userId: string) => {
  return prisma.business.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const deleteBusiness = async (id: string, userId: string) => {
  const result = await prisma.business.deleteMany({ where: { id, userId } });
  return result.count > 0;
};
