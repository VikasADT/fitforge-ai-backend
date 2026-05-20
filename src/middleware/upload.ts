import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config';

const uploadDir = config.uploadDir;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png';
    const name = `${crypto.randomUUID()}${safeExt}`;
    cb(null, name);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const blockedMimeTypes = ['image/svg+xml', 'application/x-msdownload', 'application/javascript', 'text/html'];

  if (blockedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }

  if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid file type'));
};

export const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('image');
export const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('images', 10);
