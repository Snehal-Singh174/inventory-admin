import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { prisma } from '../prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { isActive: boolean };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    // Re-validate role server-side
    prisma.user
      .findUnique({ where: { id: payload.userId }, select: { role: true, isActive: true } })
      .then((user) => {
        if (!user || !user.isActive) {
          return next(new UnauthorizedError('User account is inactive or not found'));
        }

        if (user.role !== payload.role) {
          // Role changed since token was issued — use current DB role
          req.user = { userId: payload.userId, role: user.role, isActive: user.isActive };
        } else {
          req.user = { userId: payload.userId, role: payload.role, isActive: user.isActive };
        }

        next();
      })
      .catch((err) => next(err));
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
}
