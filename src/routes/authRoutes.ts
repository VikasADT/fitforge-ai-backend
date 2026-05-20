import { Router } from 'express';
import { body } from 'express-validator';

import {
  register,
  login,
  getCurrentUser
} from '../controllers/authController';

import { validateRequest } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// REGISTER
router.post(
  '/register',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  validateRequest,
  register
);

// LOGIN
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  login
);

// CURRENT USER
router.get(
  '/me',
  authMiddleware,
  getCurrentUser
);

export default router;