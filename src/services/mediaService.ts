import fs from 'fs';
import path from 'path';
import prisma from '../prisma/client';
import { config } from '../config';
import * as activityService from './activityService';

const uploadDir = path.resolve(process.cwd(), config.uploadDir);

export const createMedia = async (
  businessId: string,
  userId: string,
  type: string,
  url: string,
  altText?: string
) => {
  const business = await prisma.business.findFirst({ where: { id: businessId, userId } });
  if (!business) return null;

  const media = await (prisma as any).businessMedia.create({
    data: {
      businessId,
      type: type as any,
      url,
      altText
    }
  });

  await activityService.recordBusinessActivity(businessId, 'MEDIA_UPLOADED', 'Media uploaded', { type, url });
  return media;
};

export const getBusinessMedia = async (businessId: string, userId?: string) => {
  if (userId) {
    const business = await prisma.business.findFirst({ where: { id: businessId, userId } });
    if (!business) return null;
  } else {
    const pub = await prisma.business.findUnique({ where: { id: businessId }, select: { isPublished: true } });
    if (!pub || !pub.isPublished) return null;
  }

  return (prisma as any).businessMedia.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
};

export const deleteMedia = async (mediaId: string, userId: string) => {
  const media = await (prisma as any).businessMedia.findUnique({ where: { id: mediaId }, include: { business: true } });
  if (!media) return null;
  if (media.business.userId !== userId) return null;

  // attempt to unlink file if it's in uploads
  try {
    const parsed = new URL(media.url, 'http://localhost');
    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    const filePath = path.resolve(process.cwd(), pathname);
    if (filePath.startsWith(uploadDir)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
  } catch (_err) {
    // ignore invalid urls
  }

  await (prisma as any).businessMedia.delete({ where: { id: mediaId } });
  await activityService.recordBusinessActivity(media.businessId, 'MEDIA_DELETED', 'Media deleted', { mediaId });
  return media;
};

export default {
  createMedia,
  getBusinessMedia,
  deleteMedia
};
