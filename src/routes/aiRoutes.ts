import { Router } from 'express';
import { generateContent } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post(
  '/generate-content',
  authMiddleware,
  [
    body('businessName').notEmpty(),
    body('services').isArray({ min: 1 }),
    body('city').optional().isString(),
    body('templateId').optional().isString(),
    body('themeColor').optional().isString(),
    body('fontStyle').optional().isString(),
    body('subdomain').optional().isString()
  ],
  validateRequest,
  generateContent
);

export default router;
