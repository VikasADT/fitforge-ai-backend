import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { userUploadLimiter } from '../middleware/rateLimiter';
import { uploadSingleFile, uploadMultipleFiles, deleteUpload } from '../controllers/uploadController';
import { uploadSingle, uploadMultiple } from '../middleware/upload';

const router = Router();

router.post('/single', authMiddleware, userUploadLimiter, uploadSingle, uploadSingleFile);
router.post('/multiple', authMiddleware, userUploadLimiter, uploadMultiple, uploadMultipleFiles);
router.delete('/:id', authMiddleware, deleteUpload);

export default router;
