import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as mediaService from '../services/mediaService';
import * as uploadService from '../services/uploadService';
import { AuthRequest } from '../middleware/auth';

const allowedTypes = ['HERO', 'GALLERY', 'LOGO', 'TRAINER'];

export const uploadBusinessMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const { id: businessId } = req.params;
  const file = req.file;
  const { type, altText } = req.body as any;

  if (!file) return fail(res, 'No file uploaded', 400);
  if (!type || !allowedTypes.includes(type)) return fail(res, 'Invalid or missing media type', 400);

  const upload = await uploadService.optimizeAndStoreUpload(file, req.user.id);
  if (!upload) return fail(res, 'Unable to store upload', 500);

  const url = '/' + upload.path.replace(/\\/g, '/');

  const media = await mediaService.createMedia(businessId, req.user.id, type, url, altText);
  if (!media) return fail(res, 'Business not found or unauthorized', 404);

  return success(res, 'Media uploaded', { media }, 201);
});

export const listBusinessMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: businessId } = req.params;
  const userId = req.user?.id;

  const media = await mediaService.getBusinessMedia(businessId, userId);
  if (!media) return fail(res, 'Business not found or/or not published', 404);
  return success(res, 'Media fetched', { media });
});

export const deleteMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const { id } = req.params;
  const deleted = await mediaService.deleteMedia(id, req.user.id);
  if (!deleted) return fail(res, 'Media not found or unauthorized', 404);
  return success(res, 'Media deleted', { media: deleted });
});

export default { uploadBusinessMedia, listBusinessMedia, deleteMedia };
