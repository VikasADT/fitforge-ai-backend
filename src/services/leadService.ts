import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';
import * as activityService from './activityService';

export type CreateLeadPayload = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  interestedPlan?: string;
};

export const createPublicLead = async (subdomain: string, payload: CreateLeadPayload) => {
  const business = await prisma.business.findFirst({
    where: {
      subdomain,
      isActive: true,
      isPublished: true
    }
  });

  if (!business) {
    return null;
  }

  const createLead = prisma.lead.create({
    data: {
      businessId: business.id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      interestedPlan: payload.interestedPlan
    }
  });

  const updateCount = prisma.business.update({
    where: { id: business.id },
    data: {
      leadCount: {
        increment: 1
      }
    }
  });

  const [lead] = await prisma.$transaction([
    createLead,
    updateCount,
    activityService.recordBusinessActivity(
      business.id,
      'LEAD_SUBMITTED',
      'Public lead submitted',
      {
        name: payload.name,
        email: payload.email,
        interestedPlan: payload.interestedPlan ?? null
      }
    )
  ]);

  return lead;
};

export const getLeadsForBusiness = async (businessId: string, userId: string, page = 1, limit = 50) => {
  const business = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!business) {
    return null;
  }

  const offset = Math.max(0, page - 1) * limit;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.lead.count({ where: { businessId } })
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total
    }
  };
};

export const incrementCtaClicks = async (subdomain: string, ctaType?: string) => {
  const business = await prisma.business.findFirst({
    where: {
      subdomain,
      isActive: true,
      isPublished: true
    }
  });

  if (!business) {
    return null;
  }

  const updateBusiness = prisma.business.update({
    where: { id: business.id },
    data: {
      ctaClicks: {
        increment: 1
      }
    }
  });

  const [updated] = await prisma.$transaction([
    updateBusiness,
    activityService.recordBusinessActivity(
      business.id,
      'CTA_CLICKED',
      'CTA clicked',
      {
        ctaType: ctaType ?? 'UNKNOWN'
      }
    )
  ]);

  return updated;
};
