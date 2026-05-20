import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post('/register', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], validateRequest, register);
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validateRequest, login);

export default router;
