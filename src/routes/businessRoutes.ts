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

// GET SINGLE BUSINESS
router.get('/:id', authMiddleware, getBusiness);

// UPDATE BUSINESS
router.put('/:id', authMiddleware, updateBusiness);

// DELETE BUSINESS
router.delete('/:id', authMiddleware, deleteBusiness);

export default router;