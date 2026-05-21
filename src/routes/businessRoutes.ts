import { Router } from 'express';
import { body } from 'express-validator';

import {
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses
} from '../controllers/businessController';

import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

/**
 * GET ALL USER BUSINESSES
 * GET /api/businesses
 */
router.get('/', authMiddleware, getUserBusinesses);

/**
 * CREATE BUSINESS
 * POST /api/businesses
 */
router.post(
  '/',
  authMiddleware,
  [
    body('businessName')
      .notEmpty()
      .withMessage('businessName is required'),

    body('category')
      .optional()
      .isString(),

    body('city')
      .optional()
      .isString(),

    body('phone')
      .optional()
      .isString(),

    body('logoUrl')
      .optional()
      .isURL(),

    body('subdomain')
      .optional()
      .isString()
      .trim()
      .toLowerCase()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage(
        'subdomain must use lowercase letters, numbers, and hyphens only'
      ),

    body('templateId')
      .optional()
      .isString(),

    body('themeColor')
      .optional()
      .isString(),

    body('fontStyle')
      .optional()
      .isString()
  ],
  validateRequest,
  createBusiness
);

/**
 * GET SINGLE BUSINESS
 * GET /api/businesses/:id
 */
router.get('/:id', authMiddleware, getBusiness);

/**
 * UPDATE BUSINESS
 * PUT /api/businesses/:id
 */
router.put(
  '/:id',
  authMiddleware,
  [
    body('businessName')
      .optional()
      .isString(),

    body('category')
      .optional()
      .isString(),

    body('city')
      .optional()
      .isString(),

    body('phone')
      .optional()
      .isString(),

    body('logoUrl')
      .optional()
      .isURL(),

    body('subdomain')
      .optional()
      .isString()
      .trim()
      .toLowerCase()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage(
        'subdomain must use lowercase letters, numbers, and hyphens only'
      ),

    body('templateId')
      .optional()
      .isString(),

    body('themeColor')
      .optional()
      .isString(),

    body('fontStyle')
      .optional()
      .isString()
  ],
  validateRequest,
  updateBusiness
);

/**
 * DELETE BUSINESS
 * DELETE /api/businesses/:id
 */
router.delete('/:id', authMiddleware, deleteBusiness);

export default router;