import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/user.controller';

const router = Router();

// All user management endpoints require Editor role
router.get('/', authenticate, authorize('Editor'), ctrl.list);
router.post('/', authenticate, authorize('Editor'), ctrl.create);
router.patch('/:id', authenticate, authorize('Editor'), ctrl.updateRole);
router.patch('/:id/deactivate', authenticate, authorize('Editor'), ctrl.deactivate);

export { router as userRouter };
