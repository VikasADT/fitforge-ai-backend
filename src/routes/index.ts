import { Router } from 'express';

import authRoutes from './authRoutes';
import businessRoutes from './businessRoutes';
import aiRoutes from './aiRoutes';
import publicRoutes from './publicRoutes';
import uploadRoutes from './uploadRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/businesses', businessRoutes);

router.use('/ai', aiRoutes);

router.use('/upload', uploadRoutes);

router.use('/public', publicRoutes);

router.use('/admin', adminRoutes);

export default router;