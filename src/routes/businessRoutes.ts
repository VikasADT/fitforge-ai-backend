import { Router } from 'express';
import {
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses
} from '../controllers/businessController';

import { authMiddleware } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = Router();

// GET ALL USER BUSINESSES
router.get('/', authMiddleware, getUserBusinesses);

// CREATE BUSINESS
router.post(
  '/create',
  authMiddleware,
  [
    body('businessName').notEmpty().withMessage('businessName is required'),
    body('category').optional().isString(),
    body('city').optional().isString(),
    body('phone').optional().isString(),
    body('logoUrl').optional().isURL(),
    body('subdomain')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/i)
      .withMessage('subdomain must be alphanumeric and may include hyphens'),
    body('templateId').optional().isString(),
    body('themeColor').optional().isString(),
    body('fontStyle').optional().isString()
  ],
  validateRequest,
  createBusiness
);

// GET SINGLE BUSINESS
router.get('/:id', authMiddleware, getBusiness);

// UPDATE BUSINESS
router.put(
  '/:id',
  authMiddleware,
  [
    body('businessName').optional().isString(),
    body('category').optional().isString(),
    body('city').optional().isString(),
    body('phone').optional().isString(),
    body('logoUrl').optional().isURL(),
    body('subdomain')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/i)
      .withMessage('subdomain must be alphanumeric and may include hyphens'),
    body('templateId').optional().isString(),
    body('themeColor').optional().isString(),
    body('fontStyle').optional().isString()
  ],
  validateRequest,
  updateBusiness
);

// DELETE BUSINESS
router.delete('/:id', authMiddleware, deleteBusiness);

export default router;