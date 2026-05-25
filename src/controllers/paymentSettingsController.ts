import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { success, fail } from '../utils/response';
import * as businessService from '../services/businessService';
import { AuthRequest } from '../middleware/auth';

export const createPaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return fail(res, 'Unauthorized', 401);
  }

  const { id } = req.params;
  const updated = await businessService.updatePaymentSettings(id, req.user.id, req.body);

  if (!updated) {
    return fail(res, 'Business not found', 404);
  }

  return success(res, 'Payment settings saved', {
    paymentSettings: {
      upiId: updated.upiId ?? null,
      paymentInstructions: updated.paymentInstructions ?? null,
      acceptsCashPayments: updated.acceptsCashPayments,
      acceptsUpiPayments: updated.acceptsUpiPayments
    }
  }, 201);
});

export const updatePaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return fail(res, 'Unauthorized', 401);
  }

  const { id } = req.params;
  const updated = await businessService.updatePaymentSettings(id, req.user.id, req.body);

  if (!updated) {
    return fail(res, 'Business not found', 404);
  }

  return success(res, 'Payment settings updated', {
    paymentSettings: {
      upiId: updated.upiId ?? null,
      paymentInstructions: updated.paymentInstructions ?? null,
      acceptsCashPayments: updated.acceptsCashPayments,
      acceptsUpiPayments: updated.acceptsUpiPayments
    }
  });
});
