-- Migration 005: audit_log table
-- Immutable, append-only record of every CREATE/UPDATE/DELETE on
-- inventory_items, categories, and suppliers.
-- entity_id is intentionally polymorphic (no DB-level FK) so that
-- deleting an entity does NOT cascade-delete its audit history.

-- ─── Enums ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE audit_entity_type AS ENUM ('INVENTORY_ITEM', 'CATEGORY', 'SUPPLIER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE audit_action_type AS ENUM ('CREATE', 'UPDATE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    audit_entity_type NOT NULL,
  entity_id      UUID              NOT NULL,   -- polymorphic; NO FK constraint by design
  entity_label   VARCHAR(255)      NOT NULL,   -- denormalized snapshot (SKU or name) for display
  action         audit_action_type NOT NULL,
  user_id        UUID              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  before_values  JSONB,                        -- NULL on CREATE
  after_values   JSONB,                        -- NULL on DELETE
  changed_fields JSONB,                        -- NULL on CREATE/DELETE; string[] on UPDATE
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
  -- NO updated_at — rows are write-once and immutable
);

-- ─── Constraints ───────────────────────────────────────────────────────────────
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_entity_label_length CHECK (char_length(entity_label) >= 1);

-- ─── Indexes ───────────────────────────────────────────────────────────────────
-- Primary audit feed sort
CREATE INDEX idx_audit_log_created_at            ON audit_log (created_at DESC);

-- Polymorphic entity lookup: "show all history for this entity"
CREATE INDEX idx_audit_log_entity_id             ON audit_log (entity_id);
CREATE INDEX idx_audit_log_entity_type_id        ON audit_log (entity_type, entity_id);

-- Filter by action type (e.g. show only DELETEs)
CREATE INDEX idx_audit_log_action                ON audit_log (action);

-- Filter by actor
CREATE INDEX idx_audit_log_user_id               ON audit_log (user_id);

-- Filter by entity type (e.g. show only INVENTORY_ITEM changes)
CREATE INDEX idx_audit_log_entity_type           ON audit_log (entity_type);

-- Composite: entity_type + action (e.g. all INVENTORY_ITEM DELETEs)
CREATE INDEX idx_audit_log_entity_type_action    ON audit_log (entity_type, action);

-- Composite: user + time (e.g. "what did this user do today?")
CREATE INDEX idx_audit_log_user_created_at       ON audit_log (user_id, created_at DESC);
