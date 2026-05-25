import prisma from '../prisma/client';
import { Prisma, MembershipPaymentMode } from '@prisma/client';
import * as activityService from './activityService';

export type CreateMembershipPayload = {
  businessId: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  features?: Prisma.InputJsonValue;
  isPopular?: boolean;
  paymentModes?: MembershipPaymentMode[];
};

export type UpdateMembershipPayload = Partial<Omit<CreateMembershipPayload, 'businessId'>>;

export const getMembershipsForBusiness = async (businessId: string, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!business) {
    return null;
  }

  return prisma.membershipPlan.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' }
  });
};

export const createMembership = async (payload: CreateMembershipPayload, userId: string) => {
  const business = await prisma.business.findFirst({ where: { id: payload.businessId, userId } });
  if (!business) {
    return null;
  }

  const membership = await prisma.membershipPlan.create({
    data: {
      businessId: payload.businessId,
      name: payload.name,
      price: payload.price,
      duration: payload.duration,
      description: payload.description,
      features: payload.features ? payload.features : undefined,
      isPopular: payload.isPopular ?? false,
      paymentModes: payload.paymentModes ?? []
    }
  });

  await activityService.recordBusinessActivity(
    payload.businessId,
    'MEMBERSHIP_CREATED',
    'Membership plan created',
    {
      name: payload.name,
      price: payload.price,
      duration: payload.duration,
      paymentModes: payload.paymentModes ?? []
    }
  );

  return membership;
};

export const updateMembership = async (id: string, userId: string, data: UpdateMembershipPayload) => {
  const membership = await prisma.membershipPlan.findFirst({
    where: {
      id,
      business: {
        userId
      }
    }
  });

  if (!membership) {
    return null;
  }

  return prisma.membershipPlan.update({
    where: { id },
    data: {
      ...data,
      paymentModes: data.paymentModes === undefined ? undefined : data.paymentModes
    }
  });
};

export const deleteMembership = async (id: string, userId: string) => {
  const membership = await prisma.membershipPlan.findFirst({
    where: {
      id,
      business: {
        userId
      }
    }
  });

  if (!membership) {
    return false;
  }

  await prisma.membershipPlan.delete({ where: { id } });
  return true;
};
