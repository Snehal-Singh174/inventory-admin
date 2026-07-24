-- Migration 004: inventory_items table
-- Core SKU entity — references categories, suppliers, and users.
-- Also adds UNIQUE constraint to suppliers.name for data integrity and idempotent seeding.

-- ─── Extensions ───────────────────────────────────────────────────────────────
-- pg_trgm: enables GIN trigram indexes for fast keyword search (item_name, sku)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Patch: enforce unique supplier names ─────────────────────────────────────
ALTER TABLE suppliers
  ADD CONSTRAINT suppliers_name_unique UNIQUE (name);

-- Drop the non-unique index that is now superseded by the constraint index
DROP INDEX IF EXISTS idx_suppliers_name;

-- ─── Enum ──────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('ACTIVE', 'DISCONTINUED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE inventory_items (
  id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name   VARCHAR(150)   NOT NULL,
  sku         VARCHAR(50)    NOT NULL,
  category_id UUID           NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  quantity    INTEGER        NOT NULL DEFAULT 0,
  unit_cost   DECIMAL(10,2)  NOT NULL,
  supplier_id UUID           NOT NULL REFERENCES suppliers(id)  ON DELETE RESTRICT,
  status      item_status    NOT NULL DEFAULT 'ACTIVE',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  created_by  UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by  UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- ─── Constraints ───────────────────────────────────────────────────────────────
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_item_name_length  CHECK (char_length(item_name) >= 1),
  ADD CONSTRAINT inventory_items_sku_length        CHECK (char_length(sku) >= 1),
  ADD CONSTRAINT inventory_items_quantity_nonneg   CHECK (quantity >= 0),
  ADD CONSTRAINT inventory_items_unit_cost_nonneg  CHECK (unit_cost >= 0);

-- ─── Indexes ───────────────────────────────────────────────────────────────────
-- SKU: unique lookup (primary business key)
CREATE UNIQUE INDEX idx_inventory_items_sku         ON inventory_items (sku);

-- FK indexes (required for FK lookups and join performance)
CREATE INDEX idx_inventory_items_category_id        ON inventory_items (category_id);
CREATE INDEX idx_inventory_items_supplier_id        ON inventory_items (supplier_id);
CREATE INDEX idx_inventory_items_created_by         ON inventory_items (created_by);
CREATE INDEX idx_inventory_items_updated_by         ON inventory_items (updated_by);

-- Filter / sort indexes
CREATE INDEX idx_inventory_items_status             ON inventory_items (status);
CREATE INDEX idx_inventory_items_quantity           ON inventory_items (quantity);
CREATE INDEX idx_inventory_items_created_at         ON inventory_items (created_at DESC);
CREATE INDEX idx_inventory_items_updated_at         ON inventory_items (updated_at DESC);

-- Composite: status + quantity (common dashboard filter: ACTIVE items below threshold)
CREATE INDEX idx_inventory_items_status_quantity    ON inventory_items (status, quantity);

-- Full-text search support: item_name + sku keyword search
CREATE INDEX idx_inventory_items_name_trgm          ON inventory_items USING gin (item_name gin_trgm_ops);
CREATE INDEX idx_inventory_items_sku_trgm           ON inventory_items USING gin (sku gin_trgm_ops);
