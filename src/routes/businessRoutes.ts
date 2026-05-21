import { Router } from 'express';
import { body, query } from 'express-validator';

import {
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses,
  getBusinessPreview,
  publishBusiness,
  unpublishBusiness,
  getBusinessAnalytics,
  getBusinessAnalyticsTrends,
  getBusinessActivity
} from '../controllers/businessController';
import {
  createMembership,
  deleteMembership,
  getMemberships,
  updateMembership
} from '../controllers/membershipController';
import { getBusinessLeads } from '../controllers/leadController';

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
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('city')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('logoUrl')
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),

    body('subdomain')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .trim()
      .toLowerCase()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage(
        'subdomain must use lowercase letters, numbers, and hyphens only'
      ),

    body('templateId')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('themeColor')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('fontStyle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('heroTitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('heroSubtitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('aboutText')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('seoTitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('seoDescription')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('whatsappNumber')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .matches(/^\+?[0-9\s-]{7,20}$/)
      .withMessage('whatsappNumber must be valid'),

    body('whatsappEnabled')
      .optional()
      .isBoolean(),

    body('ctaLabels')
      .optional()
      .isObject(),

    body('services')
      .optional()
      .isArray()
      .withMessage('services must be an array'),

    body('features')
      .optional()
      .isArray()
      .withMessage('features must be an array'),

    body('testimonials')
      .optional()
      .isArray()
      .withMessage('testimonials must be an array')
  ],
  validateRequest,
  createBusiness
);

/**
 * GET SINGLE BUSINESS
 * GET /api/businesses/:id
 */
router.get(
  '/:id/leads',
  authMiddleware,
  getBusinessLeads
);

router.get(
  '/:id/preview',
  authMiddleware,
  getBusinessPreview
);

router.post('/:id/publish', authMiddleware, publishBusiness);
router.post('/:id/unpublish', authMiddleware, unpublishBusiness);

router.get('/:id/memberships', authMiddleware, getMemberships);
router.post(
  '/:id/memberships',
  authMiddleware,
  [
    body('name').notEmpty().withMessage('Membership name is required'),
    body('price')
      .notEmpty()
      .withMessage('Membership price is required')
      .isFloat({ min: 0 })
      .withMessage('Membership price must be a non-negative number'),
    body('duration')
      .notEmpty()
      .withMessage('Membership duration is required')
      .isInt({ min: 1 })
      .withMessage('Membership duration must be a positive integer'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('features')
      .optional()
      .isArray()
      .withMessage('Membership features must be an array'),
    body('isPopular')
      .optional()
      .isBoolean()
  ],
  validateRequest,
  createMembership
);
router.put(
  '/memberships/:id',
  authMiddleware,
  [
    body('name')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Membership price must be a non-negative number'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Membership duration must be a positive integer'),
    body('description')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('features')
      .optional()
      .isArray()
      .withMessage('Membership features must be an array'),
    body('isPopular')
      .optional()
      .isBoolean()
  ],
  validateRequest,
  updateMembership
);
router.delete('/memberships/:id', authMiddleware, deleteMembership);

router.get(
  '/:id/leads',
  authMiddleware,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
  ],
  validateRequest,
  getBusinessLeads
);

router.get(
  '/:id/analytics',
  authMiddleware,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
  ],
  validateRequest,
  getBusinessAnalytics
);

router.get('/:id/analytics/trends', authMiddleware, getBusinessAnalyticsTrends);

router.get(
  '/:id/activity',
  authMiddleware,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .toInt()
  ],
  validateRequest,
  getBusinessActivity
);

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
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('category')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('city')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('logoUrl')
      .optional({ nullable: true, checkFalsy: true })
      .isURL(),

    body('subdomain')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .trim()
      .toLowerCase()
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage(
        'subdomain must use lowercase letters, numbers, and hyphens only'
      ),

    body('templateId')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('themeColor')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('fontStyle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('heroTitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('heroSubtitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('aboutText')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('seoTitle')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('seoDescription')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),

    body('whatsappNumber')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .matches(/^\+?[0-9\s-]{7,20}$/)
      .withMessage('whatsappNumber must be valid'),

    body('whatsappEnabled')
      .optional()
      .isBoolean(),

    body('ctaLabels')
      .optional()
      .isObject(),

    body('services')
      .optional()
      .isArray()
      .withMessage('services must be an array'),

    body('features')
      .optional()
      .isArray()
      .withMessage('features must be an array'),

    body('testimonials')
      .optional()
      .isArray()
      .withMessage('testimonials must be an array')
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