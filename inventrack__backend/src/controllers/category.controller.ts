import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';
import { BadRequestError } from '../utils/errors';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.getAllCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60) {
      throw new BadRequestError('name is required and must be 1-60 characters');
    }
    const category = await categoryService.createCategory({
      name: name.trim(),
      description: description?.trim(),
    });
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description } = req.body;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60)) {
      throw new BadRequestError('name must be 1-60 characters');
    }
    const category = await categoryService.updateCategory(req.params.id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
    });
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}
