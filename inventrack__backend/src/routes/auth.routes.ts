import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';

const router = Router();

const loginSchema = {
  email: { required: true, type: 'string' as const, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { required: true, type: 'string' as const, minLength: 1 },
};

const refreshSchema = {
  refreshToken: { required: true, type: 'string' as const, minLength: 1 },
};

const logoutSchema = {
  refreshToken: { required: true, type: 'string' as const, minLength: 1 },
};

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshSchema), refresh);
router.post('/logout', authenticate, validateBody(logoutSchema), logout);

export { router as authRouter };
