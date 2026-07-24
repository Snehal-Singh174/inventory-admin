-- Migration 002: categories table
-- Classification groups for inventory items.
-- Serves as a FK target for inventory_items.category_id (Module 3).

CREATE TABLE categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60)  NOT NULL,
  description VARCHAR(255),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by  UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- name: unique, minimum 1 character
ALTER TABLE categories
  ADD CONSTRAINT categories_name_length CHECK (char_length(name) >= 1);

CREATE UNIQUE INDEX idx_categories_name       ON categories (name);
CREATE        INDEX idx_categories_created_by ON categories (created_by);
CREATE        INDEX idx_categories_created_at ON categories (created_at DESC);
