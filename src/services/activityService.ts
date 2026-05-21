import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export type ActivityMetadata = Prisma.InputJsonValue;

export const recordBusinessActivity = (
  businessId: string,
  type: string,
  message?: string,
  metadata?: ActivityMetadata
) => {
  return prisma.businessActivity.create({
    data: {
      businessId,
      // allow string to be passed for newly-added enum values until Prisma client is regenerated
      type: type as any,
      message,
      metadata
    }
  });
};

export const getActivityFeed = async (
  businessId: string,
  userId: string,
  page = 1,
  limit = 20
) => {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId }
  });
  if (!business) {
    return null;
  }

  const offset = Math.max(0, page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.businessActivity.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        type: true,
        message: true,
        metadata: true,
        createdAt: true
      }
    }),
    prisma.businessActivity.count({ where: { businessId } })
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
