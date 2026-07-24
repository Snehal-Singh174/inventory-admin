import { Request, Response, NextFunction } from 'express';
import { loginUser, refreshAccessToken, logoutUser } from '../services/auth.service';
import { successResponse } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    const response = successResponse(result, 200);
    res.status(response.status).json(response);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const result = await refreshAccessToken(refreshToken);
    const response = successResponse(result, 200);
    res.status(response.status).json(response);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    const userId = req.user!.userId;
    await logoutUser(refreshToken, userId);
    const response = successResponse({ message: 'Logged out successfully' }, 200);
    res.status(response.status).json(response);
  } catch (err) {
    next(err);
  }
}
