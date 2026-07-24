import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as ctrl from '../controllers/inventory.controller';

const router = Router();

// GET - both Viewer and Editor
router.get('/', authenticate, ctrl.getAll);
router.get('/export', authenticate, ctrl.exportExcel);
router.get('/:id', authenticate, ctrl.getById);

// Mutating - Editor only
router.post('/', authenticate, authorize('Editor'), ctrl.create);
router.patch('/bulk-status', authenticate, authorize('Editor'), ctrl.bulkStatus);
router.patch('/bulk-delete', authenticate, authorize('Editor'), ctrl.bulkDeleteItems);
router.patch('/:id', authenticate, authorize('Editor'), ctrl.update);
router.delete('/:id', authenticate, authorize('Editor'), ctrl.remove);

export { router as inventoryRouter };
