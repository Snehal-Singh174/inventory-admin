import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/audit.controller';

const router = Router();

// Editor only — Viewers cannot access audit log
router.get('/', authenticate, authorize('Editor'), ctrl.getAll);

export { router as auditRouter };
