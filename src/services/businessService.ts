import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import * as activityService from './activityService';

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
      ctaLabels: data.ctaLabels ? data.ctaLabels : undefined
    }
  });
};

export const getBusinessById = async (id: string) => prisma.business.findUnique({ where: { id } });

export const getBusinessByIdForUser = async (id: string, userId: string) =>
  prisma.business.findFirst({ where: { id, userId } });

export const getBusinessBySubdomain = async (subdomain: string) =>
  prisma.business.findUnique({ where: { subdomain } });

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

  return prisma.business.update({
    where: { id },
    data: {
      ...data,
      services: data.services === undefined ? undefined : data.services,
      features: data.features === undefined ? undefined : data.features,
      testimonials: data.testimonials === undefined ? undefined : data.testimonials,
      websiteContent: data.websiteContent === undefined ? undefined : data.websiteContent,
      ctaLabels: data.ctaLabels === undefined ? undefined : data.ctaLabels
    }
  });
};

export const publishBusiness = async (id: string, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) {
    return null;
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      isPublished: true,
      publishedAt: new Date()
    }
  });

  await activityService.recordBusinessActivity(id, 'WEBSITE_PUBLISHED', 'Website published');
  return updated;
};

export const unpublishBusiness = async (id: string, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id, userId } });
  if (!business) {
    return null;
  }

  const updated = await prisma.business.update({
    where: { id },
    data: {
      isPublished: false,
      publishedAt: null
    }
  });

  await activityService.recordBusinessActivity(id, 'WEBSITE_UNPUBLISHED', 'Website unpublished');
  return updated;
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
