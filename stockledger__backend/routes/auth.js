'use strict';

const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/authenticate');
const { sendData, appError } = require('../utils/response');

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET || 'stockledger_dev_secret_changeme_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(appError('Email and password are required', 400, 'VALIDATION_ERROR'));
    }

    const result = await db.query(
      'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return next(appError('Invalid credentials', 401, 'AUTH_FAILED'));
    }

    if (!user.is_active) {
      return next(appError('Account deactivated. Contact your administrator.', 403, 'ACCOUNT_DISABLED'));
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return next(appError('Invalid credentials', 401, 'AUTH_FAILED'));
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    sendData(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [req.user.sub]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return next(appError('User not found or inactive', 401, 'AUTH_INVALID'));
    }

    sendData(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Stateless JWT — client discards token; server acknowledges.
router.post('/logout', authenticate, (_req, res) => {
  sendData(res, { message: 'Logged out successfully' });
});

module.exports = router;
