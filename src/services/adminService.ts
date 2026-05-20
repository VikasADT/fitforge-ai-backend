import prisma from '../prisma/client';

export const listUsers = async () => {
  return prisma.user.findMany({ include: { businesses: true, uploads: true } });
};

export const listBusinesses = async () => {
  return prisma.business.findMany();
};

export const getAnalytics = async () => {
  const totalBusinesses = await prisma.business.count();
  const activeBusinesses = await prisma.business.count({ where: { isActive: true } });
  const aiGenerations = await prisma.$queryRaw`SELECT SUM("aiGenerations") FROM "Business"` as any;
  const uploadsCount = await prisma.upload.count();
  const activeSubscriptions = await prisma.business.count({ where: { subscriptionStatus: 'ACTIVE' } });

  return {
    totalBusinesses,
    activeBusinesses,
    aiGenerations: aiGenerations?.[0]?.sum ?? null,
    uploadsCount,
    activeSubscriptions
  };
};

export const listSubscriptions = async () => {
  return prisma.business.findMany({ select: { id: true, userId: true, subscriptionStatus: true, planType: true, customDomain: true } });
};

export const updateBusinessStatus = async (id: string, isActive: boolean) => {
  return prisma.business.update({ where: { id }, data: { isActive } });
};

export const deleteBusiness = async (id: string) => {
  return prisma.business.delete({ where: { id } });
};

export default {
  listUsers,
  listBusinesses,
  getAnalytics,
  listSubscriptions,
  updateBusinessStatus,
  deleteBusiness
};
