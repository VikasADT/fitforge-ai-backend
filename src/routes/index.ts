import { Router } from 'express';
import authRoutes from './authRoutes';
import businessRoutes from './businessRoutes';
import aiRoutes from './aiRoutes';
import publicRoutes from './publicRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/business', businessRoutes);
router.use('/business', aiRoutes);
router.use('/upload', uploadRoutes);
router.use('/public', publicRoutes);

export default router;
