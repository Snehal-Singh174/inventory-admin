'use strict';

const { Router } = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { sendList } = require('../utils/response');

const router = Router();

const VALID_ENTITY_TYPES = ['INVENTORY_ITEM', 'CATEGORY', 'SUPPLIER'];
const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

/**
 * Build a dynamic WHERE clause for audit_log queries.
 * Supports both camelCase and snake_case aliases.
 * Returns { where: string, params: Array, nextIdx: number }
 */
function buildAuditWhere(q, startIdx) {
  const conditions = [];
  const params = [];
  let idx = startIdx || 1;

  // entityType
  const entityType = q.entityType || q.entity_type;
  if (entityType && VALID_ENTITY_TYPES.includes(entityType)) {
    conditions.push(`a.entity_type = $${idx++}`);
    params.push(entityType);
  }

  // action
  if (q.action && VALID_ACTIONS.includes(q.action)) {
    conditions.push(`a.action = $${idx++}`);
    params.push(q.action);
  }

  // userId
  const userId = q.userId || q.user_id;
  if (userId) {
    conditions.push(`a.user_id = $${idx++}`);
    params.push(userId);
  }

  // entity_id direct filter
  if (q.entity_id) {
    conditions.push(`a.entity_id = $${idx++}`);
    params.push(q.entity_id);
  }

  // Date range
  const rawFrom = q.dateFrom || q.from;
  const rawTo = q.dateTo || q.to;
  if (rawFrom) {
    const d = new Date(rawFrom);
    if (!isNaN(d.getTime())) {
      conditions.push(`a.created_at >= $${idx++}`);
      params.push(d);
    }
  }
  if (rawTo) {
    const d = new Date(rawTo);
    if (!isNaN(d.getTime())) {
      // Extend end-of-day when only a date string is supplied
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawTo)) {
        d.setHours(23, 59, 59, 999);
      }
      conditions.push(`a.created_at <= $${idx++}`);
      params.push(d);
    }
  }

  // Keyword search across entity_label
  const keyword = q.search || q.keyword;
  if (keyword && keyword.trim()) {
    conditions.push(`a.entity_label ILIKE $${idx++}`);
    params.push(`%${keyword.trim()}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  return { where, params, nextIdx: idx };
}

/** Format a raw audit_log row joining in the actor user. */
function formatRow(r) {
  return {
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
  };
}

// ─── GET /api/audit-log ───────────────────────────────────────────────────────
router.get('/', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const q = req.query;
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20', 10)));

    const { where, params, nextIdx } = buildAuditWhere(q, 1);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM audit_log a ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, pageSize, (page - 1) * pageSize];
    const limitIdx = nextIdx;
    const offsetIdx = nextIdx + 1;

    const dataResult = await db.query(
      `SELECT a.*,
              u.id    AS actor_id,
              u.name  AS actor_name,
              u.email AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    sendList(res, dataResult.rows.map(formatRow), { total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/audit-log/:entityId ─────────────────────────────────────────────
router.get('/:entityId', authenticate, requireRole('EDITOR'), async (req, res, next) => {
  try {
    const { entityId } = req.params;
    const q = req.query;
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20', 10)));

    // Build extra filters starting at $2 (entity_id occupies $1)
    const extraFilters = buildAuditWhere(q, 2);
    const allParams = [entityId, ...extraFilters.params];
    const baseWhere = `WHERE a.entity_id = $1${extraFilters.where ? ' AND ' + extraFilters.where.replace('WHERE ', '') : ''}`;

    const countResult = await db.query(
      `SELECT COUNT(*) FROM audit_log a ${baseWhere}`,
      allParams
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const limitIdx = extraFilters.nextIdx;
    const offsetIdx = extraFilters.nextIdx + 1;
    const dataParams = [...allParams, pageSize, (page - 1) * pageSize];

    const dataResult = await db.query(
      `SELECT a.*,
              u.id    AS actor_id,
              u.name  AS actor_name,
              u.email AS actor_email
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       ${baseWhere}
       ORDER BY a.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    sendList(res, dataResult.rows.map(formatRow), { total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
