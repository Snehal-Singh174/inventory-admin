'use strict';

const { Router } = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { recordAudit, computeChangedFields } = require('../services/audit');
const { sendData, sendList, appError } = require('../utils/response');

const router = Router();

/** Count inventory_items referencing this category. */
async function categoryItemCount(categoryId) {
  const r = await db.query(
    'SELECT COUNT(*) FROM inventory_items WHERE category_id = $1',
    [categoryId]
  );
  return parseInt(r.rows[0].count, 10);
}

// ─── GET /api/categories ──────────────────────────────────────────────────────
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*,
              CAST(COUNT(i.id) AS INTEGER) AS item_count
       FROM categories c
       LEFT JOIN inventory_items i ON i.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
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

// ─── GET /api/categories/:id ──────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) {
      return next(appError('Category not found', 404, 'NOT_FOUND'));
    }
    const cat = result.rows[0];
    const item_count = await categoryItemCount(cat.id);
    sendData(res, { ...cat, item_count });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/categories ─────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(appError('name is required', 400, 'VALIDATION_ERROR'));
    }
    if (name.trim().length > 60) {
      return next(appError('name must be 60 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (description != null && String(description).length > 255) {
      return next(appError('description must be 255 characters or fewer', 400, 'VALIDATION_ERROR'));
    }

    const result = await db.query(
      `INSERT INTO categories (name, description, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [
        name.trim(),
        description ? String(description).trim() : null,
        req.user.sub,
      ]
    );
    const category = result.rows[0];

    await recordAudit({
      entityType: 'CATEGORY',
      entityId: category.id,
      entityLabel: category.name,
      action: 'CREATE',
      userId: req.user.sub,
      beforeValues: null,
      afterValues: category,
    });

    sendData(res, category, 201);
  } catch (err) {
    if (err.code === '23505') {
      return next(appError('A category with this name already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── PATCH /api/categories/:id ────────────────────────────────────────────────
router.patch('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Category not found', 404, 'NOT_FOUND'));
    }

    const { name, description } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return next(appError('name cannot be empty', 400, 'VALIDATION_ERROR'));
      }
      if (name.trim().length > 60) {
        return next(appError('name must be 60 characters or fewer', 400, 'VALIDATION_ERROR'));
      }
    }
    if (description != null && description !== undefined && String(description).length > 255) {
      return next(appError('description must be 255 characters or fewer', 400, 'VALIDATION_ERROR'));
    }

    const setClauses = [];
    const params = [];
    let idx = 1;

    if (name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(name.trim()); }
    if (description !== undefined) {
      setClauses.push(`description = $${idx++}`);
      params.push(description ? String(description).trim() : null);
    }

    if (setClauses.length === 0) {
      return next(appError('No valid fields provided for update', 400, 'VALIDATION_ERROR'));
    }

    params.push(req.params.id);
    const beforeValues = { ...existing };

    const updateResult = await db.query(
      `UPDATE categories SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    const afterValues = updateResult.rows[0];
    const changedFields = computeChangedFields(beforeValues, afterValues);

    if (changedFields.length > 0) {
      await recordAudit({
        entityType: 'CATEGORY',
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
      return next(appError('A category with this name already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── DELETE /api/categories/:id ───────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Category not found', 404, 'NOT_FOUND'));
    }

    const itemCount = await categoryItemCount(existing.id);
    if (itemCount > 0) {
      return next(
        appError(
          `Cannot delete — ${itemCount} item${itemCount === 1 ? '' : 's'} use this category`,
          409,
          'CONFLICT'
        )
      );
    }

    const beforeValues = { ...existing };
    await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);

    await recordAudit({
      entityType: 'CATEGORY',
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
