import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/category.controller';

const router = Router();

// GET - both Viewer and Editor
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);

// Mutating - Editor only
router.post('/', authenticate, authorize('Editor'), ctrl.create);
router.patch('/:id', authenticate, authorize('Editor'), ctrl.update);
router.delete('/:id', authenticate, authorize('Editor'), ctrl.remove);

export { router as categoryRouter };
