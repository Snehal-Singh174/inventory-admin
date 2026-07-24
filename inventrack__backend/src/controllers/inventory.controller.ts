import { Request, Response, NextFunction } from 'express';
import * as inventoryService from '../services/inventory.service';
import { generateInventoryExcel } from '../services/export.service';
import { BadRequestError } from '../utils/errors';

function parseQueryParams(query: Record<string, unknown>): inventoryService.GetInventoryParams {
  return {
    page: query.page ? parseInt(query.page as string, 10) : undefined,
    limit: query.limit ? parseInt(query.limit as string, 10) : undefined,
    sortBy: query.sortBy as string | undefined,
    sortOrder: query.sortOrder === 'asc' ? 'asc' : query.sortOrder === 'desc' ? 'desc' : undefined,
    keyword: query.keyword as string | undefined,
    categoryId: query.categoryId as string | undefined,
    status: query.status as string | undefined,
    supplierId: query.supplierId as string | undefined,
    minQuantity: query.minQuantity ? parseInt(query.minQuantity as string, 10) : undefined,
    maxQuantity: query.maxQuantity ? parseInt(query.maxQuantity as string, 10) : undefined,
  };
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const params = parseQueryParams(req.query as Record<string, unknown>);
    const result = await inventoryService.getInventoryItems(params);
    res.json({ data: result.items, meta: { totalCount: result.totalCount, page: result.page, limit: result.limit, totalPages: result.totalPages } });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await inventoryService.getInventoryItemById(req.params.id);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemName, sku, categoryId, quantity, unitCost, supplierId, status, reorderPoint } = req.body;

    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0 || itemName.trim().length > 150) {
      throw new BadRequestError('itemName is required (1-150 characters)');
    }
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0 || sku.trim().length > 50) {
      throw new BadRequestError('sku is required (1-50 characters)');
    }
    if (!categoryId || typeof categoryId !== 'string') {
      throw new BadRequestError('categoryId is required');
    }
    if (quantity === undefined || typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
      throw new BadRequestError('quantity must be a non-negative integer');
    }
    if (unitCost === undefined || typeof unitCost !== 'number' || unitCost < 0) {
      throw new BadRequestError('unitCost must be a non-negative number');
    }
    if (!supplierId || typeof supplierId !== 'string') {
      throw new BadRequestError('supplierId is required');
    }
    if (status && !['Active', 'Discontinued'].includes(status)) {
      throw new BadRequestError('status must be Active or Discontinued');
    }
    if (reorderPoint !== undefined && (typeof reorderPoint !== 'number' || reorderPoint < 0 || !Number.isInteger(reorderPoint))) {
      throw new BadRequestError('reorderPoint must be a non-negative integer');
    }

    const item = await inventoryService.createInventoryItem(
      { itemName: itemName.trim(), sku: sku.trim(), categoryId, quantity, unitCost, supplierId, status, reorderPoint },
      req.user!.userId,
    );
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { itemName, sku, categoryId, quantity, unitCost, supplierId, status, reorderPoint } = req.body;

    if (itemName !== undefined && (typeof itemName !== 'string' || itemName.trim().length === 0 || itemName.trim().length > 150)) {
      throw new BadRequestError('itemName must be 1-150 characters');
    }
    if (sku !== undefined && (typeof sku !== 'string' || sku.trim().length === 0 || sku.trim().length > 50)) {
      throw new BadRequestError('sku must be 1-50 characters');
    }
    if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity))) {
      throw new BadRequestError('quantity must be a non-negative integer');
    }
    if (unitCost !== undefined && (typeof unitCost !== 'number' || unitCost < 0)) {
      throw new BadRequestError('unitCost must be a non-negative number');
    }
    if (status !== undefined && !['Active', 'Discontinued'].includes(status)) {
      throw new BadRequestError('status must be Active or Discontinued');
    }
    if (reorderPoint !== undefined && (typeof reorderPoint !== 'number' || reorderPoint < 0 || !Number.isInteger(reorderPoint))) {
      throw new BadRequestError('reorderPoint must be a non-negative integer');
    }

    const input: inventoryService.UpdateInventoryInput = {};
    if (itemName !== undefined) input.itemName = itemName.trim();
    if (sku !== undefined) input.sku = sku.trim();
    if (categoryId !== undefined) input.categoryId = categoryId;
    if (quantity !== undefined) input.quantity = quantity;
    if (unitCost !== undefined) input.unitCost = unitCost;
    if (supplierId !== undefined) input.supplierId = supplierId;
    if (status !== undefined) input.status = status;
    if (reorderPoint !== undefined) input.reorderPoint = reorderPoint;

    const item = await inventoryService.updateInventoryItem(req.params.id, input, req.user!.userId);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await inventoryService.deleteInventoryItem(req.params.id, req.user!.userId);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

export async function bulkStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('ids must be a non-empty array');
    }
    if (!status || !['Active', 'Discontinued'].includes(status)) {
      throw new BadRequestError('status must be Active or Discontinued');
    }
    const result = await inventoryService.bulkUpdateStatus(ids, status, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function bulkDeleteItems(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError('ids must be a non-empty array');
    }
    const result = await inventoryService.bulkDelete(ids, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const params = parseQueryParams(req.query as Record<string, unknown>);
    const buffer = await generateInventoryExcel(params);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
