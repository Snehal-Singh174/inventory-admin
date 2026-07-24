import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as string as any,
    issuer: 'inventrack',
  };
  return jwt.sign({ ...payload }, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as string as any,
    issuer: 'inventrack',
  };
  return jwt.sign({ ...payload }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'inventrack' }) as JwtPayload & TokenPayload;
  return { userId: decoded.userId, role: decoded.role };
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'inventrack' }) as JwtPayload & TokenPayload;
  return { userId: decoded.userId, role: decoded.role };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
