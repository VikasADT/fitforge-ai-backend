import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { userUploadLimiter } from '../middleware/rateLimiter';
import { uploadSingle } from '../middleware/upload';
import { uploadBusinessMedia, listBusinessMedia, deleteMedia } from '../controllers/mediaController';

const router = Router();

router.post('/:id', authMiddleware, userUploadLimiter, uploadSingle, uploadBusinessMedia);
router.get('/:id', authMiddleware, listBusinessMedia);
router.delete('/:id', authMiddleware, deleteMedia);

export default router;
