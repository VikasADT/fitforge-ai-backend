import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import prisma from '../prisma/client';
import { config } from '../config';

const uploadDir = path.resolve(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const toPosixPath = (value: string) => value.replace(/\\/g, '/');

export const optimizeAndStoreUpload = async (file: any, userId: string) => {
  const optimizedFilename = `${crypto.randomUUID()}.webp`;
  const optimizedPath = path.join(uploadDir, optimizedFilename);

  await sharp(file.path)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(optimizedPath);

  await fs.promises.unlink(file.path);
  const stats = await fs.promises.stat(optimizedPath);

  const uploadRecord = await prisma.upload.create({
    data: {
      userId,
      filename: optimizedFilename,
      originalName: file.originalname,
      mimeType: 'image/webp',
      size: Number(stats.size),
      path: toPosixPath(path.join(config.uploadDir, optimizedFilename))
    }
  });

  return uploadRecord;
};

export const optimizeAndStoreUploads = async (files: any[], userId: string) => {
  const uploads = [] as any[];
  for (const file of files) {
    const upload = await optimizeAndStoreUpload(file, userId);
    uploads.push(upload);
  }
  return uploads;
};

export const deleteUploadById = async (userId: string, uploadId: string) => {
  const existing = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!existing || existing.userId !== userId) {
    return null;
  }

  const uploadPath = path.join(process.cwd(), existing.path);
  try {
    await fs.promises.unlink(uploadPath);
  } catch (_err) {
    // Continue if file no longer exists.
  }

  await prisma.upload.delete({ where: { id: uploadId } });
  return existing;
};
