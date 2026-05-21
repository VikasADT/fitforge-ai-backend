import { Router } from 'express';
import { body } from 'express-validator';
import { getPublicWebsite } from '../controllers/publicController';
import { createPublicLead, trackPublicCta } from '../controllers/leadController';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.get('/:subdomain', getPublicWebsite);

router.post(
  '/:subdomain/lead',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('message')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('interestedPlan')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
  ],
  validateRequest,
  createPublicLead
);

router.post(
  '/:subdomain/cta',
  [
    body('ctaType')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .isIn(['WHATSAPP_CLICK', 'CONTACT_CLICK', 'PRICING_CLICK', 'LEAD_FORM_SUBMIT', 'OTHER'])
      .withMessage('ctaType must be one of WHATSAPP_CLICK, CONTACT_CLICK, PRICING_CLICK, LEAD_FORM_SUBMIT, OTHER')
  ],
  validateRequest,
  trackPublicCta
);

export default router;
