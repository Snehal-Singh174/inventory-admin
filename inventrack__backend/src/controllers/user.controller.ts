import { Request, Response, NextFunction } from 'express';
import { getUsers, createUser, changeUserRole, toggleUserActive } from '../services/user.service';
import { BadRequestError } from '../utils/errors';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, role, page, limit } = req.query;
    const result = await getUsers({
      search: search as string | undefined,
      role: role as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({
      data: result.items,
      meta: { totalCount: result.totalCount, page: result.page, limit: result.limit, totalPages: result.totalPages },
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, fullName, role } = req.body;
    if (!email || !fullName || !role) {
      throw new BadRequestError('email, fullName, and role are required');
    }

    const result = await createUser({ email, fullName, role }, req.user!.userId);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
      throw new BadRequestError('role is required');
    }

    const result = await changeUserRole(id, role, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await toggleUserActive(id, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
