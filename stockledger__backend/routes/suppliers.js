'use strict';

const { Router } = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { recordAudit, computeChangedFields } = require('../services/audit');
const { sendData, sendList, appError } = require('../utils/response');

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Count inventory_items referencing this supplier. */
async function supplierItemCount(supplierId) {
  const r = await db.query(
    'SELECT COUNT(*) FROM inventory_items WHERE supplier_id = $1',
    [supplierId]
  );
  return parseInt(r.rows[0].count, 10);
}

// ─── GET /api/suppliers ───────────────────────────────────────────────────────
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT s.*,
              CAST(COUNT(i.id) AS INTEGER) AS item_count
       FROM suppliers s
       LEFT JOIN inventory_items i ON i.supplier_id = s.id
       GROUP BY s.id
       ORDER BY s.name ASC`
    );
    sendList(res, result.rows, {
      total: result.rows.length,
      page: 1,
      pageSize: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/suppliers/:id ───────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return next(appError('Supplier not found', 404, 'NOT_FOUND'));
    }
    const sup = result.rows[0];
    const item_count = await supplierItemCount(sup.id);
    sendData(res, { ...sup, item_count });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/suppliers ──────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { name, contact_email, phone, address } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(appError('name is required', 400, 'VALIDATION_ERROR'));
    }
    if (name.trim().length > 100) {
      return next(appError('name must be 100 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (contact_email && !EMAIL_RE.test(contact_email)) {
      return next(appError('contact_email must be a valid email address', 400, 'VALIDATION_ERROR'));
    }
    if (phone && String(phone).length > 50) {
      return next(appError('phone must be 50 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (address && String(address).length > 255) {
      return next(appError('address must be 255 characters or fewer', 400, 'VALIDATION_ERROR'));
    }

    const result = await db.query(
      `INSERT INTO suppliers (name, contact_email, phone, address, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name.trim(),
        contact_email ? String(contact_email).trim() : null,
        phone ? String(phone).trim() : null,
        address ? String(address).trim() : null,
        req.user.sub,
      ]
    );
    const supplier = result.rows[0];

    await recordAudit({
      entityType: 'SUPPLIER',
      entityId: supplier.id,
      entityLabel: supplier.name,
      action: 'CREATE',
      userId: req.user.sub,
      beforeValues: null,
      afterValues: supplier,
    });

    sendData(res, supplier, 201);
  } catch (err) {
    if (err.code === '23505') {
      return next(appError('A supplier with this name already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── PATCH /api/suppliers/:id ─────────────────────────────────────────────────
router.patch('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Supplier not found', 404, 'NOT_FOUND'));
    }

    const { name, contact_email, phone, address } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return next(appError('name cannot be empty', 400, 'VALIDATION_ERROR'));
      }
      if (name.trim().length > 100) {
        return next(appError('name must be 100 characters or fewer', 400, 'VALIDATION_ERROR'));
      }
    }
    if (contact_email !== undefined && contact_email !== null && contact_email !== '') {
      if (!EMAIL_RE.test(contact_email)) {
        return next(appError('contact_email must be a valid email address', 400, 'VALIDATION_ERROR'));
      }
    }
    if (phone !== undefined && phone !== null && String(phone).length > 50) {
      return next(appError('phone must be 50 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (address !== undefined && address !== null && String(address).length > 255) {
      return next(appError('address must be 255 characters or fewer', 400, 'VALIDATION_ERROR'));
    }

    const setClauses = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(name.trim()); }
    if (contact_email !== undefined) {
      setClauses.push(`contact_email = $${idx++}`);
      params.push(contact_email ? String(contact_email).trim() : null);
    }
    if (phone !== undefined) {
      setClauses.push(`phone = $${idx++}`);
      params.push(phone ? String(phone).trim() : null);
    }
    if (address !== undefined) {
      setClauses.push(`address = $${idx++}`);
      params.push(address ? String(address).trim() : null);
    }

    if (setClauses.length === 0) {
      return next(appError('No valid fields provided for update', 400, 'VALIDATION_ERROR'));
    }

    params.push(req.params.id);
    const beforeValues = { ...existing };

    const updateResult = await db.query(
      `UPDATE suppliers SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    const afterValues = updateResult.rows[0];
    const changedFields = computeChangedFields(beforeValues, afterValues);

    if (changedFields.length > 0) {
      await recordAudit({
        entityType: 'SUPPLIER',
        entityId: afterValues.id,
        entityLabel: afterValues.name,
        action: 'UPDATE',
        userId: req.user.sub,
        beforeValues,
        afterValues,
        changedFields,
      });
    }

    sendData(res, afterValues);
  } catch (err) {
    if (err.code === '23505') {
      return next(appError('A supplier with this name already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── DELETE /api/suppliers/:id ────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Supplier not found', 404, 'NOT_FOUND'));
    }

    const itemCount = await supplierItemCount(existing.id);
    if (itemCount > 0) {
      return next(
        appError(
          `Cannot delete — ${itemCount} item${itemCount === 1 ? '' : 's'} use this supplier`,
          409,
          'CONFLICT'
        )
      );
    }

    const beforeValues = { ...existing };
    await db.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);

    await recordAudit({
      entityType: 'SUPPLIER',
      entityId: String(beforeValues.id),
      entityLabel: String(beforeValues.name),
      action: 'DELETE',
      userId: req.user.sub,
      beforeValues,
      afterValues: null,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
