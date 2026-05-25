import { Router } from 'express';
import { body } from 'express-validator';
import { getPublicWebsite } from '../controllers/publicController';
import { createMembershipInquiry, createPublicLead, trackPublicCta } from '../controllers/leadController';
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
  '/:subdomain/membership-inquiry',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone')
      .optional({ nullable: true, checkFalsy: true })
      .isString(),
    body('membershipId')
      .notEmpty()
      .withMessage('membershipId is required')
      .isString(),
    body('preferredPaymentMode')
      .optional({ nullable: true, checkFalsy: true })
      .isIn(['CASH', 'UPI', 'CONTACT_OWNER'])
      .withMessage('preferredPaymentMode must be one of CASH, UPI, or CONTACT_OWNER')
  ],
  validateRequest,
  createMembershipInquiry
);

router.post(
  '/:subdomain/cta',
  [
    body('ctaType')
      .optional({ nullable: true, checkFalsy: true })
      .isString()
      .isIn(['WHATSAPP_CLICK', 'WHATSAPP_MEMBERSHIP_CLICK', 'CONTACT_CLICK', 'PAYMENT_CTA_CLICK', 'PRICING_CLICK', 'LEAD_FORM_SUBMIT', 'JOIN_INQUIRY_CLICK', 'OTHER'])
      .withMessage('ctaType must be one of WHATSAPP_CLICK, WHATSAPP_MEMBERSHIP_CLICK, CONTACT_CLICK, PAYMENT_CTA_CLICK, PRICING_CLICK, LEAD_FORM_SUBMIT, JOIN_INQUIRY_CLICK, OTHER')
  ],
  validateRequest,
  trackPublicCta
);

export default router;
