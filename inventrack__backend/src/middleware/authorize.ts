import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('No user context available'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' does not have permission for this action`));
    }

    next();
  };
}
