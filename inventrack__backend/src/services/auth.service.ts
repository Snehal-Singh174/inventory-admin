import { prisma } from '../prisma/client';
import { comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, BadRequestError } from '../utils/errors';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokenPayload: TokenPayload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  // Store refresh token hash in sessions table
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: tokenHash,
      userId: payload.userId,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new UnauthorizedError('Session not found or expired');
  }

  // Verify user still active
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true, isActive: true } });
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User account is inactive');
  }

  // Rotate: delete old session, create new one
  await prisma.session.delete({ where: { id: session.id } });

  const newPayload: TokenPayload = { userId: payload.userId, role: user.role };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId: payload.userId,
      refreshTokenHash: hashToken(newRefreshToken),
      expiresAt,
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string, userId: string): Promise<void> {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: tokenHash,
      userId,
    },
  });

  if (session) {
    await prisma.session.delete({ where: { id: session.id } });
  }
}
