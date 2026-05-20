import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as uploadService from '../services/uploadService';
import { AuthRequest } from '../middleware/auth';

export const uploadSingleFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const file = req.file;
  if (!file) return fail(res, 'No file uploaded', 400);

  const uploadRecord = await uploadService.optimizeAndStoreUpload(file, req.user.id);
  return success(res, 'Upload successful', { upload: uploadRecord }, 201);
});

export const uploadMultipleFiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) return fail(res, 'No files uploaded', 400);

  const uploads = await uploadService.optimizeAndStoreUploads(files, req.user.id);
  return success(res, 'Files uploaded', { uploads }, 201);
});

export const deleteUpload = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return fail(res, 'Unauthorized', 401);
  const { id } = req.params;
  const deleted = await uploadService.deleteUploadById(req.user.id, id);
  if (!deleted) return fail(res, 'Upload not found or unauthorized', 404);
  return success(res, 'Upload deleted successfully', {});
});
