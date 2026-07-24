import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from '../services/audit.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const { entityType, entityId, action, performedBy, userId, dateFrom, dateTo, page, limit, sortBy, sortOrder } = req.query;
    const result = await getAuditLogs({
      entityType: entityType as string | undefined,
      entityId: entityId as string | undefined,
      action: action as string | undefined,
      performedBy: (userId || performedBy) as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as string | undefined,
      sortOrder: sortOrder === 'asc' ? 'asc' : sortOrder === 'desc' ? 'desc' : undefined,
    });
    res.json({
      data: result.items,
      meta: { totalCount: result.totalCount, page: result.page, limit: result.limit, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
}
