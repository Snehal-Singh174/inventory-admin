'use strict';

const db = require('../db');

/**
 * Write one row to audit_log. Silently logs on failure so business ops never
 * roll back because of an audit write error.
 *
 * @param {object} entry
 * @param {'INVENTORY_ITEM'|'CATEGORY'|'SUPPLIER'} entry.entityType
 * @param {string} entry.entityId
 * @param {string} entry.entityLabel
 * @param {'CREATE'|'UPDATE'|'DELETE'} entry.action
 * @param {string} entry.userId
 * @param {object|null} [entry.beforeValues]
 * @param {object|null} [entry.afterValues]
 * @param {string[]|null} [entry.changedFields]
 */
async function recordAudit(entry) {
  try {
    await db.query(
      `INSERT INTO audit_log
         (entity_type, entity_id, entity_label, action, user_id,
          before_values, after_values, changed_fields)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.entityType,
        entry.entityId,
        entry.entityLabel,
        entry.action,
        entry.userId,
        entry.beforeValues ? JSON.stringify(entry.beforeValues) : null,
        entry.afterValues ? JSON.stringify(entry.afterValues) : null,
        entry.changedFields ? JSON.stringify(entry.changedFields) : null,
      ]
    );
  } catch (err) {
    console.error('[audit] Failed to record audit entry:', err.message);
  }
}

/**
 * Return array of key names whose values differ between before and after.
 * @param {object} before
 * @param {object} after
 * @returns {string[]}
 */
function computeChangedFields(before, after) {
  const changed = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}

module.exports = { recordAudit, computeChangedFields };
