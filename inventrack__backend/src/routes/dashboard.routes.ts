import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as ctrl from '../controllers/dashboard.controller';

const router = Router();

// Dashboard accessible to both Editor and Viewer
router.get('/summary', authenticate, ctrl.summary);

export { router as dashboardRouter };
