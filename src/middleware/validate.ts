import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { fail } from '../utils/response';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 'Validation failed', 400, { errors: errors.array() });
  }
  next();
};
