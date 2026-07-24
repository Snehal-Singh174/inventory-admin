'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET =
  process.env.JWT_SECRET || 'stockledger_dev_secret_changeme_in_production';

/**
 * Verify Bearer JWT and attach payload to req.user.
 * Returns 401 if header is missing, token is invalid, or token is expired.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Authentication required', code: 'AUTH_REQUIRED', status: 401 });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ error: message, code: 'AUTH_INVALID', status: 401 });
  }
}

/**
 * Middleware factory: require that req.user.role === role, else 403.
 * Must be placed AFTER authenticate.
 * @param {'EDITOR'|'VIEWER'} role
 */
function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        status: 403,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
