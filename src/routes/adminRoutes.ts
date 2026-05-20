import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import requireRole from '../middleware/role';
import adminController from '../controllers/adminController';

const router = Router();

router.use(authMiddleware, requireRole('SUPER_ADMIN'));

router.get('/users', adminController.getUsers);
router.get('/businesses', adminController.getBusinesses);
router.get('/analytics', adminController.getAnalytics);
router.get('/subscriptions', adminController.getSubscriptions);
router.patch('/business/:id/status', adminController.patchBusinessStatus);
router.delete('/business/:id', adminController.deleteBusiness);

export default router;
