import { Router } from 'express';
import { createBusiness, getBusiness, updateBusiness, deleteBusiness } from '../controllers/businessController';
import { authMiddleware } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post(
  '/create',
  authMiddleware,
  [
    body('businessName').notEmpty(),
    body('category').optional().isString(),
    body('city').optional().isString(),
    body('phone').optional().isString(),
    body('logoUrl').optional().isURL(),
    body('subdomain').optional().isString(),
    body('templateId').optional().isString(),
    body('themeColor').optional().isString(),
    body('fontStyle').optional().isString()
  ],
  validateRequest,
  createBusiness
);
router.get('/:id', authMiddleware, getBusiness);
router.put('/:id', authMiddleware, updateBusiness);
router.delete('/:id', authMiddleware, deleteBusiness);

export default router;
