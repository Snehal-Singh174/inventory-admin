import { prisma } from '../prisma/client';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { createAuditEntry, createManyAuditEntries } from './audit.service';

export interface CreateInventoryInput {
  itemName: string;
  sku: string;
  categoryId: string;
  quantity: number;
  unitCost: number;
  supplierId: string;
  status?: string;
  reorderPoint?: number;
}

export interface UpdateInventoryInput {
  itemName?: string;
  sku?: string;
  categoryId?: string;
  quantity?: number;
  unitCost?: number;
  supplierId?: string;
  status?: string;
  reorderPoint?: number;
}

export interface GetInventoryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  keyword?: string;
  categoryId?: string;
  status?: string;
  supplierId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

const ALLOWED_SORT_FIELDS = ['itemName', 'sku', 'quantity', 'unitCost', 'status', 'createdAt', 'updatedAt'];

function buildWhereClause(params: GetInventoryParams): Prisma.InventoryItemWhereInput {
  const where: Prisma.InventoryItemWhereInput = { isDeleted: false };

  if (params.keyword) {
    where.OR = [
      { itemName: { contains: params.keyword, mode: 'insensitive' } },
      { sku: { contains: params.keyword, mode: 'insensitive' } },
    ];
  }
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.status) where.status = params.status;
  if (params.supplierId) where.supplierId = params.supplierId;
  if (params.minQuantity !== undefined || params.maxQuantity !== undefined) {
    where.quantity = {};
    if (params.minQuantity !== undefined) where.quantity.gte = params.minQuantity;
    if (params.maxQuantity !== undefined) where.quantity.lte = params.maxQuantity;
  }

  return where;
}

function buildOrderBy(params: GetInventoryParams): Prisma.InventoryItemOrderByWithRelationInput {
  const field = params.sortBy && ALLOWED_SORT_FIELDS.includes(params.sortBy) ? params.sortBy : 'createdAt';
  const order = params.sortOrder || 'desc';
  return { [field]: order };
}

export async function getInventoryItems(params: GetInventoryParams) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;
  const where = buildWhereClause(params);
  const orderBy = buildOrderBy(params);

  const [items, totalCount] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        creator: { select: { id: true, fullName: true } },
        updater: { select: { id: true, fullName: true } },
      },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return {
    items,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function getInventoryItemById(id: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id, isDeleted: false },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      creator: { select: { id: true, fullName: true } },
      updater: { select: { id: true, fullName: true } },
    },
  });
  if (!item) throw new NotFoundError('Inventory item not found');
  return item;
}

export async function createInventoryItem(input: CreateInventoryInput, userId: string) {
  const existingSku = await prisma.inventoryItem.findFirst({
    where: { sku: input.sku, isDeleted: false },
  });
  if (existingSku) throw new BadRequestError(`SKU '${input.sku}' already exists`);

  const item = await prisma.inventoryItem.create({
    data: {
      itemName: input.itemName,
      sku: input.sku,
      categoryId: input.categoryId,
      quantity: input.quantity,
      unitCost: input.unitCost,
      supplierId: input.supplierId,
      status: input.status || 'Active',
      reorderPoint: input.reorderPoint ?? 10,
      createdBy: userId,
      updatedBy: userId,
    },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });

  await createAuditEntry({
    entityType: 'InventoryItem',
    entityId: item.id,
    action: 'create',
    performedBy: userId,
    beforeValues: null,
    afterValues: {
      itemName: item.itemName,
      sku: item.sku,
      categoryId: item.categoryId,
      quantity: item.quantity,
      unitCost: Number(item.unitCost),
      supplierId: item.supplierId,
      status: item.status,
      reorderPoint: item.reorderPoint,
    },
  });

  return item;
}

export async function updateInventoryItem(id: string, input: UpdateInventoryInput, userId: string) {
  const existing = await prisma.inventoryItem.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new NotFoundError('Inventory item not found');

  if (input.sku && input.sku !== existing.sku) {
    const skuTaken = await prisma.inventoryItem.findFirst({
      where: { sku: input.sku, isDeleted: false, NOT: { id } },
    });
    if (skuTaken) throw new BadRequestError(`SKU '${input.sku}' already exists`);
  }

  const beforeValues = {
    itemName: existing.itemName,
    sku: existing.sku,
    categoryId: existing.categoryId,
    quantity: existing.quantity,
    unitCost: Number(existing.unitCost),
    supplierId: existing.supplierId,
    status: existing.status,
    reorderPoint: existing.reorderPoint,
  };

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(input.itemName !== undefined && { itemName: input.itemName }),
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.unitCost !== undefined && { unitCost: input.unitCost }),
      ...(input.supplierId !== undefined && { supplierId: input.supplierId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.reorderPoint !== undefined && { reorderPoint: input.reorderPoint }),
      updatedBy: userId,
    },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });

  const afterValues = {
    itemName: item.itemName,
    sku: item.sku,
    categoryId: item.categoryId,
    quantity: item.quantity,
    unitCost: Number(item.unitCost),
    supplierId: item.supplierId,
    status: item.status,
    reorderPoint: item.reorderPoint,
  };

  await createAuditEntry({
    entityType: 'InventoryItem',
    entityId: item.id,
    action: 'update',
    performedBy: userId,
    beforeValues,
    afterValues,
  });

  return item;
}

export async function deleteInventoryItem(id: string, userId: string) {
  const existing = await prisma.inventoryItem.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new NotFoundError('Inventory item not found');

  await prisma.inventoryItem.update({
    where: { id },
    data: { isDeleted: true, updatedBy: userId },
  });

  await createAuditEntry({
    entityType: 'InventoryItem',
    entityId: id,
    action: 'delete',
    performedBy: userId,
    beforeValues: {
      itemName: existing.itemName,
      sku: existing.sku,
      status: existing.status,
      quantity: existing.quantity,
    },
    afterValues: null,
  });
}

export async function bulkUpdateStatus(ids: string[], status: string, userId: string) {
  if (!['Active', 'Discontinued'].includes(status)) {
    throw new BadRequestError('Status must be Active or Discontinued');
  }
  if (!ids.length || ids.length > 100) {
    throw new BadRequestError('Provide 1 to 100 item IDs');
  }

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: ids }, isDeleted: false },
  });

  if (items.length !== ids.length) {
    throw new BadRequestError(`Some items not found. Found ${items.length} of ${ids.length} requested.`);
  }

  const auditEntries = items.map((item) => ({
    entityType: 'InventoryItem',
    entityId: item.id,
    action: 'bulk_status_update',
    performedBy: userId,
    beforeValues: { status: item.status },
    afterValues: { status },
  }));

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: { status, updatedBy: userId },
    });

    await tx.auditLog.createMany({
      data: auditEntries.map((entry) => ({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        performedBy: entry.performedBy,
        beforeValues: entry.beforeValues as Prisma.InputJsonValue,
        afterValues: entry.afterValues as Prisma.InputJsonValue,
      })),
    });
  });

  return { updated: items.length, status };
}

export async function bulkDelete(ids: string[], userId: string) {
  if (!ids.length || ids.length > 100) {
    throw new BadRequestError('Provide 1 to 100 item IDs');
  }

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: ids }, isDeleted: false },
  });

  if (items.length !== ids.length) {
    throw new BadRequestError(`Some items not found. Found ${items.length} of ${ids.length} requested.`);
  }

  const auditEntries = items.map((item) => ({
    entityType: 'InventoryItem',
    entityId: item.id,
    action: 'bulk_delete',
    performedBy: userId,
    beforeValues: { itemName: item.itemName, sku: item.sku, status: item.status, quantity: item.quantity },
    afterValues: null,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true, updatedBy: userId },
    });

    await tx.auditLog.createMany({
      data: auditEntries.map((entry) => ({
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        performedBy: entry.performedBy,
        beforeValues: entry.beforeValues as Prisma.InputJsonValue,
        afterValues: entry.afterValues === null ? Prisma.JsonNull : (entry.afterValues as Prisma.InputJsonValue),
      })),
    });
  });

  return { deleted: items.length };
}

export async function getFilteredItemsForExport(params: GetInventoryParams) {
  const where = buildWhereClause(params);
  const orderBy = buildOrderBy(params);

  return prisma.inventoryItem.findMany({
    where,
    orderBy,
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true } },
    },
  });
}
