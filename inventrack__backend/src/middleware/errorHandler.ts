import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      status: err.status,
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    status: 500,
  });
}
