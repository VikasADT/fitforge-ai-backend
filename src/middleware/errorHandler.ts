import { Request, Response, NextFunction } from 'express';
import { fail } from '../utils/response';
import logger from '../utils/logger';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';

  logger.error(message, { stack: err.stack, status });

  if (process.env.NODE_ENV === 'production') {
    return fail(res, message, status);
  }

  return fail(res, message, status, { stack: err.stack });
};
