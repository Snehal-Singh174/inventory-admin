-- Migration 003: suppliers table
-- Vendor records for inventory items.
-- Serves as a FK target for inventory_items.supplier_id (Module 3).

CREATE TABLE suppliers (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  phone         VARCHAR(50),
  address       VARCHAR(255),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- name: minimum 1 character
ALTER TABLE suppliers
  ADD CONSTRAINT suppliers_name_length CHECK (char_length(name) >= 1);

CREATE INDEX idx_suppliers_name       ON suppliers (name);
CREATE INDEX idx_suppliers_created_by ON suppliers (created_by);
CREATE INDEX idx_suppliers_created_at ON suppliers (created_at DESC);
