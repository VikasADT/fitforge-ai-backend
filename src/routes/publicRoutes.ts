import { Router } from 'express';
import { getPublicWebsite } from '../controllers/publicController';

const router = Router();

router.get('/:subdomain', getPublicWebsite);

export default router;
