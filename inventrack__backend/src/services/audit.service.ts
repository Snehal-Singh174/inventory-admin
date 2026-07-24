import { prisma } from '../prisma/client';
import { Prisma } from '@prisma/client';

export interface CreateAuditInput {
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  beforeValues?: Record<string, unknown> | null;
  afterValues?: Record<string, unknown> | null;
}

export async function createAuditEntry(input: CreateAuditInput) {
  return prisma.auditLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: input.performedBy,
      beforeValues: input.beforeValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
      afterValues: input.afterValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
    },
  });
}

export async function createManyAuditEntries(inputs: CreateAuditInput[]) {
  return prisma.auditLog.createMany({
    data: inputs.map((input) => ({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: input.performedBy,
      beforeValues: input.beforeValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
      afterValues: input.afterValues as Prisma.InputJsonValue ?? Prisma.JsonNull,
    })),
  });
}

export interface GetAuditLogsParams {
  entityType?: string;
  entityId?: string;
  action?: string;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function getAuditLogs(params: GetAuditLogsParams) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.action) where.action = params.action;
  if (params.performedBy) where.performedBy = params.performedBy;

  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
  }

  const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
    [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
  };

  const [items, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        performer: { select: { id: true, fullName: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}
