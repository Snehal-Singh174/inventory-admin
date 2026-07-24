import { Router, Request, Response } from 'express';

const router = Router();

let seeded = false;

export function setSeeded(value: boolean): void {
  seeded = value;
}

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', seeded });
});

export { router as healthRouter };
