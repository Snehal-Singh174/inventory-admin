import { prisma } from '../prisma/client';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { createAuditEntry } from './audit.service';

export interface GetUsersParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export async function getUsers(params: GetUsersParams) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: string;
}

export async function createUser(input: CreateUserInput, performedById: string) {
  if (!['Editor', 'Viewer'].includes(input.role)) {
    throw new BadRequestError('Role must be either "Editor" or "Viewer"');
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  // Generate a temporary password
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      passwordHash,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await createAuditEntry({
    entityType: 'User',
    entityId: user.id,
    action: 'CREATE',
    performedBy: performedById,
    beforeValues: null,
    afterValues: { email: user.email, fullName: user.fullName, role: user.role },
  });

  return { ...user, temporaryPassword: tempPassword };
}

export async function changeUserRole(targetUserId: string, newRole: string, performedById: string) {
  if (targetUserId === performedById) {
    throw new ForbiddenError('You cannot change your own role');
  }

  if (!['Editor', 'Viewer'].includes(newRole)) {
    throw new BadRequestError('Role must be either "Editor" or "Viewer"');
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const oldRole = user.role;
  if (oldRole === newRole) {
    throw new BadRequestError(`User already has role "${newRole}"`);
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditEntry({
    entityType: 'User',
    entityId: targetUserId,
    action: 'ROLE_CHANGE',
    performedBy: performedById,
    beforeValues: { role: oldRole },
    afterValues: { role: newRole },
  });

  return updated;
}

export async function toggleUserActive(targetUserId: string, performedById: string) {
  if (targetUserId === performedById) {
    throw new ForbiddenError('You cannot deactivate your own account');
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const newActive = !user.isActive;
  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: newActive },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createAuditEntry({
    entityType: 'User',
    entityId: targetUserId,
    action: newActive ? 'ACTIVATE' : 'DEACTIVATE',
    performedBy: performedById,
    beforeValues: { isActive: user.isActive },
    afterValues: { isActive: newActive },
  });

  return updated;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 10; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += specials.charAt(Math.floor(Math.random() * specials.length));
  return pwd;
}
