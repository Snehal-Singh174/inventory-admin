import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary } from '../services/dashboard.service';

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getDashboardSummary();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
