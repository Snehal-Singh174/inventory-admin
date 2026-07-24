import { Request, Response, NextFunction } from 'express';
import * as supplierService from '../services/supplier.service';
import { BadRequestError } from '../utils/errors';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    res.json({ data: suppliers });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, contactEmail, phone } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
      throw new BadRequestError('name is required and must be 1-100 characters');
    }
    if (contactEmail && typeof contactEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        throw new BadRequestError('contactEmail must be a valid email address');
      }
    }
    const supplier = await supplierService.createSupplier({
      name: name.trim(),
      contactEmail: contactEmail?.trim(),
      phone: phone?.trim(),
    });
    res.status(201).json({ data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, contactEmail, phone } = req.body;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100)) {
      throw new BadRequestError('name must be 1-100 characters');
    }
    if (contactEmail && typeof contactEmail === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        throw new BadRequestError('contactEmail must be a valid email address');
      }
    }
    const supplier = await supplierService.updateSupplier(req.params.id, {
      ...(name !== undefined && { name: name.trim() }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() }),
    });
    res.json({ data: supplier });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await supplierService.deleteSupplier(req.params.id);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    next(err);
  }
}
