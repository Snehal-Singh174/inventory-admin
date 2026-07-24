'use strict';

const { Router } = require('express');
const ExcelJS = require('exceljs');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { recordAudit, computeChangedFields } = require('../services/audit');
const { sendData, sendList, appError } = require('../utils/response');

const router = Router();

const VALID_STATUSES = ['ACTIVE', 'DISCONTINUED'];
const VALID_SORT_COLS = {
  item_name: 'i.item_name',
  sku: 'i.sku',
  quantity: 'i.quantity',
  unit_cost: 'i.unit_cost',
  status: 'i.status',
  created_at: 'i.created_at',
  updated_at: 'i.updated_at',
};

const ITEM_BASE_SELECT = `
  SELECT
    i.id, i.item_name, i.sku, i.category_id, i.quantity, i.unit_cost,
    i.supplier_id, i.status, i.created_at, i.updated_at,
    i.created_by, i.updated_by,
    c.id AS cat_id, c.name AS cat_name,
    s.id AS sup_id, s.name AS sup_name
  FROM inventory_items i
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN suppliers s ON s.id = i.supplier_id
`;

/**
 * Build WHERE clause + params array from query string.
 * Returns { where: string, params: Array, nextIdx: number }
 */
function buildItemsWhere(q) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (q.status && VALID_STATUSES.includes(q.status)) {
    conditions.push(`i.status = $${idx++}`);
    params.push(q.status);
  }

  if (q.category) {
    const ids = q.category
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 1) {
      conditions.push(`i.category_id = $${idx++}`);
      params.push(ids[0]);
    } else if (ids.length > 1) {
      const holders = ids.map(() => `$${idx++}`).join(', ');
      conditions.push(`i.category_id IN (${holders})`);
      params.push(...ids);
    }
  }

  if (q.quantityMin !== undefined && q.quantityMin !== '') {
    const v = parseInt(q.quantityMin, 10);
    if (!isNaN(v)) {
      conditions.push(`i.quantity >= $${idx++}`);
      params.push(v);
    }
  }

  if (q.quantityMax !== undefined && q.quantityMax !== '') {
    const v = parseInt(q.quantityMax, 10);
    if (!isNaN(v)) {
      conditions.push(`i.quantity <= $${idx++}`);
      params.push(v);
    }
  }

  const kw = (q.search || q.keyword || '').trim();
  if (kw) {
    // Reuse same $idx for both ILIKE comparisons — PostgreSQL supports parameter reuse
    conditions.push(`(i.item_name ILIKE $${idx} OR i.sku ILIKE $${idx})`);
    params.push(`%${kw}%`);
    idx++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, params, nextIdx: idx };
}

/** Build ORDER BY clause from query string. */
function buildOrderBy(sortBy, sortOrder) {
  const dir = sortOrder === 'asc' ? 'ASC' : 'DESC';
  if (sortBy === 'category') return `c.name ${dir} NULLS LAST`;
  if (sortBy === 'supplier') return `s.name ${dir} NULLS LAST`;
  if (VALID_SORT_COLS[sortBy]) return `${VALID_SORT_COLS[sortBy]} ${dir}`;
  return 'i.created_at DESC';
}

/** Shape a DB row into the standard item response shape. */
function formatItem(row) {
  const unitCost = parseFloat(row.unit_cost) || 0;
  const qty = parseInt(row.quantity, 10) || 0;
  return {
    id: row.id,
    item_name: row.item_name,
    sku: row.sku,
    category_id: row.category_id,
    quantity: qty,
    unit_cost: unitCost,
    total_value: parseFloat((qty * unitCost).toFixed(2)),
    supplier_id: row.supplier_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
    supplier: row.sup_id ? { id: row.sup_id, name: row.sup_name } : null,
  };
}

/** Extract only the plain scalar columns (for audit diff). */
function toPlainItem(row) {
  return {
    id: row.id,
    item_name: row.item_name,
    sku: row.sku,
    category_id: row.category_id,
    quantity: row.quantity,
    unit_cost: row.unit_cost,
    supplier_id: row.supplier_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
  };
}

// ─── GET /api/items ───────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const q = req.query;
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20', 10)));
    const orderBy = buildOrderBy(q.sortBy, q.sortOrder);
    const { where, params, nextIdx } = buildItemsWhere(q);

    // Count query
    const countParams = [...params];
    const countResult = await db.query(
      `SELECT COUNT(*) FROM inventory_items i ${where}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Data query — append LIMIT/OFFSET params
    const dataParams = [...params, pageSize, (page - 1) * pageSize];
    const limitIdx = nextIdx;
    const offsetIdx = nextIdx + 1;

    const dataResult = await db.query(
      `${ITEM_BASE_SELECT} ${where} ORDER BY ${orderBy} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    sendList(res, dataResult.rows.map(formatItem), { total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/items/export ────────────────────────────────────────────────────
router.get('/export', authenticate, async (req, res, next) => {
  try {
    const q = req.query;
    const orderBy = buildOrderBy(q.sortBy, q.sortOrder);
    const { where, params } = buildItemsWhere(q);

    const result = await db.query(
      `${ITEM_BASE_SELECT} ${where} ORDER BY ${orderBy}`,
      params
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = 'StockLedger';
    wb.created = new Date();
    const ws = wb.addWorksheet('Inventory');

    ws.columns = [
      { header: 'Item Name',       key: 'item_name',   width: 32 },
      { header: 'SKU',             key: 'sku',         width: 16 },
      { header: 'Category',        key: 'category',    width: 22 },
      { header: 'Quantity',        key: 'quantity',    width: 12 },
      { header: 'Unit Cost ($)',   key: 'unit_cost',   width: 15 },
      { header: 'Total Value ($)', key: 'total_value', width: 16 },
      { header: 'Supplier',        key: 'supplier',    width: 22 },
      { header: 'Status',          key: 'status',      width: 15 },
      { header: 'Created At',      key: 'created_at',  width: 22 },
      { header: 'Updated At',      key: 'updated_at',  width: 22 },
    ];

    const hdrRow = ws.getRow(1);
    hdrRow.font = { bold: true };
    hdrRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    hdrRow.alignment = { vertical: 'middle' };

    for (const row of result.rows) {
      const unitCost = parseFloat(row.unit_cost) || 0;
      const qty = parseInt(row.quantity, 10) || 0;
      ws.addRow({
        item_name:   row.item_name,
        sku:         row.sku,
        category:    row.cat_name || '',
        quantity:    qty,
        unit_cost:   unitCost,
        total_value: parseFloat((qty * unitCost).toFixed(2)),
        supplier:    row.sup_name || '',
        status:      row.status,
        created_at:  row.created_at
          ? new Date(row.created_at).toISOString().slice(0, 19).replace('T', ' ')
          : '',
        updated_at:  row.updated_at
          ? new Date(row.updated_at).toISOString().slice(0, 19).replace('T', ' ')
          : '',
      });
    }

    const filename = `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/items/bulk-delete ──────────────────────────────────────────────
router.post('/bulk-delete', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(appError('ids must be a non-empty array', 400, 'VALIDATION_ERROR'));
    }

    const holders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const itemsResult = await db.query(
      `SELECT * FROM inventory_items WHERE id IN (${holders})`,
      ids
    );

    let deletedCount = 0;
    for (const row of itemsResult.rows) {
      await db.query('DELETE FROM inventory_items WHERE id = $1', [row.id]);
      deletedCount++;
      await recordAudit({
        entityType: 'INVENTORY_ITEM',
        entityId: row.id,
        entityLabel: row.sku,
        action: 'DELETE',
        userId: req.user.sub,
        beforeValues: toPlainItem(row),
        afterValues: null,
      });
    }

    sendData(res, { deletedCount });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/items/bulk-status ──────────────────────────────────────────────
router.post('/bulk-status', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(appError('ids must be a non-empty array', 400, 'VALIDATION_ERROR'));
    }
    if (!VALID_STATUSES.includes(status)) {
      return next(appError('status must be ACTIVE or DISCONTINUED', 400, 'VALIDATION_ERROR'));
    }

    const holders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const itemsResult = await db.query(
      `SELECT * FROM inventory_items WHERE id IN (${holders})`,
      ids
    );

    let updatedCount = 0;
    const now = new Date();

    for (const row of itemsResult.rows) {
      if (row.status === status) {
        updatedCount++;
        continue;
      }
      const beforeValues = toPlainItem(row);
      await db.query(
        `UPDATE inventory_items SET status = $1, updated_by = $2, updated_at = $3 WHERE id = $4`,
        [status, req.user.sub, now, row.id]
      );
      // Re-fetch updated row for after snapshot
      const afterResult = await db.query(
        'SELECT * FROM inventory_items WHERE id = $1',
        [row.id]
      );
      const afterRow = afterResult.rows[0];
      const afterValues = toPlainItem(afterRow);
      const changedFields = computeChangedFields(beforeValues, afterValues);

      if (changedFields.length > 0) {
        const diffBefore = {};
        const diffAfter = {};
        for (const f of changedFields) {
          diffBefore[f] = beforeValues[f];
          diffAfter[f] = afterValues[f];
        }
        await recordAudit({
          entityType: 'INVENTORY_ITEM',
          entityId: row.id,
          entityLabel: row.sku,
          action: 'UPDATE',
          userId: req.user.sub,
          beforeValues: diffBefore,
          afterValues: diffAfter,
          changedFields,
        });
      }
      updatedCount++;
    }

    sendData(res, { updatedCount });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/items/:id/audit ─────────────────────────────────────────────────
// Must be registered before /:id to avoid id="audit" collision
router.get('/:id/audit', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const q = req.query;
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20', 10)));

    const countResult = await db.query(
      'SELECT COUNT(*) FROM audit_log WHERE entity_id = $1',
      [id]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await db.query(
      `SELECT a.*, u.id AS actor_id, u.name AS actor_name, u.email AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.entity_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, pageSize, (page - 1) * pageSize]
    );

    const rows = dataResult.rows.map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      entity_label: r.entity_label,
      action: r.action,
      user_id: r.user_id,
      before_values: r.before_values,
      after_values: r.after_values,
      changed_fields: r.changed_fields,
      created_at: r.created_at,
      actor: r.actor_id
        ? { id: r.actor_id, name: r.actor_name, email: r.actor_email }
        : null,
    }));

    sendList(res, rows, { total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/items/:id ───────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `${ITEM_BASE_SELECT} WHERE i.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      return next(appError('Item not found', 404, 'NOT_FOUND'));
    }
    sendData(res, formatItem(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/items ──────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { item_name, sku, category_id, quantity, unit_cost, supplier_id, status } = req.body;
    const itemStatus = status || 'ACTIVE';

    if (!item_name || typeof item_name !== 'string' || !item_name.trim()) {
      return next(appError('item_name is required', 400, 'VALIDATION_ERROR'));
    }
    if (item_name.trim().length > 150) {
      return next(appError('item_name must be 150 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      return next(appError('sku is required', 400, 'VALIDATION_ERROR'));
    }
    if (sku.trim().length > 50) {
      return next(appError('sku must be 50 characters or fewer', 400, 'VALIDATION_ERROR'));
    }
    if (!category_id) {
      return next(appError('category_id is required', 400, 'VALIDATION_ERROR'));
    }
    if (!supplier_id) {
      return next(appError('supplier_id is required', 400, 'VALIDATION_ERROR'));
    }
    if (quantity === undefined || quantity === null || isNaN(Number(quantity)) || Number(quantity) < 0) {
      return next(appError('quantity must be a non-negative integer', 400, 'VALIDATION_ERROR'));
    }
    if (unit_cost === undefined || unit_cost === null || isNaN(Number(unit_cost)) || Number(unit_cost) < 0) {
      return next(appError('unit_cost must be a non-negative number', 400, 'VALIDATION_ERROR'));
    }
    if (!VALID_STATUSES.includes(itemStatus)) {
      return next(appError('status must be ACTIVE or DISCONTINUED', 400, 'VALIDATION_ERROR'));
    }

    const insertResult = await db.query(
      `INSERT INTO inventory_items
         (item_name, sku, category_id, quantity, unit_cost, supplier_id, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [
        item_name.trim(),
        sku.trim().toUpperCase(),
        category_id,
        Math.floor(Number(quantity)),
        parseFloat(Number(unit_cost).toFixed(2)),
        supplier_id,
        itemStatus,
        req.user.sub,
      ]
    );
    const newRow = insertResult.rows[0];

    await recordAudit({
      entityType: 'INVENTORY_ITEM',
      entityId: newRow.id,
      entityLabel: newRow.sku,
      action: 'CREATE',
      userId: req.user.sub,
      beforeValues: null,
      afterValues: toPlainItem(newRow),
    });

    // Return full item with joins
    const fullResult = await db.query(`${ITEM_BASE_SELECT} WHERE i.id = $1`, [newRow.id]);
    sendData(res, formatItem(fullResult.rows[0]), 201);
  } catch (err) {
    if (err.code === '23505') {
      return next(appError('An item with this SKU already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── PATCH /api/items/:id ─────────────────────────────────────────────────────
router.patch('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Item not found', 404, 'NOT_FOUND'));
    }

    const { item_name, sku, category_id, quantity, unit_cost, supplier_id, status } = req.body;
    const setClauses = [];
    const params = [];
    let idx = 1;

    if (item_name !== undefined) {
      if (typeof item_name !== 'string' || !item_name.trim()) {
        return next(appError('item_name cannot be empty', 400, 'VALIDATION_ERROR'));
      }
      if (item_name.trim().length > 150) {
        return next(appError('item_name must be 150 characters or fewer', 400, 'VALIDATION_ERROR'));
      }
      setClauses.push(`item_name = $${idx++}`);
      params.push(item_name.trim());
    }
    if (sku !== undefined) {
      if (typeof sku !== 'string' || !sku.trim()) {
        return next(appError('sku cannot be empty', 400, 'VALIDATION_ERROR'));
      }
      setClauses.push(`sku = $${idx++}`);
      params.push(sku.trim().toUpperCase());
    }
    if (category_id !== undefined) {
      setClauses.push(`category_id = $${idx++}`);
      params.push(category_id);
    }
    if (supplier_id !== undefined) {
      setClauses.push(`supplier_id = $${idx++}`);
      params.push(supplier_id);
    }
    if (quantity !== undefined) {
      if (isNaN(Number(quantity)) || Number(quantity) < 0) {
        return next(appError('quantity must be a non-negative integer', 400, 'VALIDATION_ERROR'));
      }
      setClauses.push(`quantity = $${idx++}`);
      params.push(Math.floor(Number(quantity)));
    }
    if (unit_cost !== undefined) {
      if (isNaN(Number(unit_cost)) || Number(unit_cost) < 0) {
        return next(appError('unit_cost must be a non-negative number', 400, 'VALIDATION_ERROR'));
      }
      setClauses.push(`unit_cost = $${idx++}`);
      params.push(parseFloat(Number(unit_cost).toFixed(2)));
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return next(appError('status must be ACTIVE or DISCONTINUED', 400, 'VALIDATION_ERROR'));
      }
      setClauses.push(`status = $${idx++}`);
      params.push(status);
    }

    if (setClauses.length === 0) {
      return next(appError('No valid fields provided for update', 400, 'VALIDATION_ERROR'));
    }

    setClauses.push(`updated_by = $${idx++}`);
    params.push(req.user.sub);
    setClauses.push(`updated_at = $${idx++}`);
    params.push(new Date());
    params.push(req.params.id); // for WHERE id = $n

    const beforeValues = toPlainItem(existing);

    await db.query(
      `UPDATE inventory_items SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params
    );

    const afterResult = await db.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    const afterRow = afterResult.rows[0];
    const afterValues = toPlainItem(afterRow);
    const changedFields = computeChangedFields(beforeValues, afterValues);

    if (changedFields.length > 0) {
      const diffBefore = {};
      const diffAfter = {};
      for (const f of changedFields) {
        diffBefore[f] = beforeValues[f];
        diffAfter[f] = afterValues[f];
      }
      await recordAudit({
        entityType: 'INVENTORY_ITEM',
        entityId: afterRow.id,
        entityLabel: afterRow.sku,
        action: 'UPDATE',
        userId: req.user.sub,
        beforeValues: diffBefore,
        afterValues: diffAfter,
        changedFields,
      });
    }

    const fullResult = await db.query(`${ITEM_BASE_SELECT} WHERE i.id = $1`, [req.params.id]);
    sendData(res, formatItem(fullResult.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return next(appError('An item with this SKU already exists', 409, 'CONFLICT'));
    }
    next(err);
  }
});

// ─── DELETE /api/items/:id ────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const existResult = await db.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    const existing = existResult.rows[0];
    if (!existing) {
      return next(appError('Item not found', 404, 'NOT_FOUND'));
    }

    const beforeValues = toPlainItem(existing);
    await db.query('DELETE FROM inventory_items WHERE id = $1', [req.params.id]);

    await recordAudit({
      entityType: 'INVENTORY_ITEM',
      entityId: String(beforeValues.id),
      entityLabel: String(beforeValues.sku),
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
