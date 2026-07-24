import bcrypt from 'bcrypt';
import { pool } from './db.js';

const SALT_ROUNDS = 12;

// ─── Users ────────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    name: 'Marcus Editor',
    email: 'marcus.editor@stockledger.io',
    password: 'EditStock#2026',
    role: 'EDITOR',
  },
  {
    name: 'Priya Viewer',
    email: 'priya.viewer@stockledger.io',
    password: 'ViewStock#2026',
    role: 'VIEWER',
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────
const DEMO_CATEGORIES = [
  { name: 'Electronics',         description: 'Scanners, hubs, readers, and electronic peripherals' },
  { name: 'Packaging Materials', description: 'Boxes, wraps, tape, and other packaging consumables' },
  { name: 'Safety & PPE',        description: 'Personal protective equipment and workplace safety items' },
  { name: 'Office Supplies',     description: 'Paper, labels, stationery, and general office consumables' },
  { name: 'Industrial Hardware', description: 'Shelving, material handling equipment, and fixtures' },
  { name: 'Cleaning Supplies',   description: 'Degreasers, sanitizers, and janitorial consumables' },
  { name: 'Tools & Equipment',   description: 'Hand tools, power tools, and measuring instruments' },
];

// ─── Suppliers ────────────────────────────────────────────────────────────────
const DEMO_SUPPLIERS = [
  {
    name:          'TechSource Global',
    contact_email: 'orders@techsource.io',
    phone:         '+1-800-555-0101',
    address:       '1200 Commerce Blvd, Austin TX 78701',
  },
  {
    name:          'PackRight Solutions',
    contact_email: 'sales@packright.com',
    phone:         '+1-800-555-0202',
    address:       '88 Warehouse Row, Chicago IL 60601',
  },
  {
    name:          'SafetyFirst Inc.',
    contact_email: 'info@safetyfirst.co',
    phone:         '+1-800-555-0303',
    address:       '45 Industrial Park Dr, Detroit MI 48201',
  },
  {
    name:          'OfficePro Supplies',
    contact_email: 'hello@officepro.net',
    phone:         '+1-800-555-0404',
    address:       '720 Business Center Ct, Atlanta GA 30301',
  },
  {
    name:          'IndustrialDirect Ltd.',
    contact_email: 'procurement@indusdirect.com',
    phone:         '+1-800-555-0505',
    address:       '3300 Factory Ave, Cleveland OH 44101',
  },
  {
    name:          'CleanCo Wholesale',
    contact_email: 'orders@cleancowholesale.com',
    phone:         '+1-800-555-0606',
    address:       '19 Supply Lane, Phoenix AZ 85001',
  },
];

// ─── Inventory Items ──────────────────────────────────────────────────────────
// Columns: [sku, item_name, category_name, quantity, unit_cost, supplier_name, status]
// Low-stock items: qty <= 10 (reorder threshold)
// DISCONTINUED: items no longer carried
const DEMO_ITEMS = [
  // Electronics (TechSource Global / IndustrialDirect Ltd.)
  ['ELEC-001', 'USB-C Hub 7-Port',           'Electronics',          45,   24.99, 'TechSource Global',     'ACTIVE'],
  ['ELEC-002', 'Barcode Scanner LS2208',      'Electronics',           8,  189.50, 'TechSource Global',     'ACTIVE'],   // low-stock
  ['ELEC-003', 'Label Printer ZD420',         'Electronics',           3,  299.00, 'TechSource Global',     'ACTIVE'],   // low-stock
  ['ELEC-004', 'Bluetooth Headset H540',      'Electronics',           0,   65.00, 'TechSource Global',     'DISCONTINUED'],
  ['ELEC-005', 'RFID Reader RDR-100',         'Electronics',          12,  449.99, 'IndustrialDirect Ltd.', 'ACTIVE'],

  // Packaging Materials (PackRight Solutions)
  ['PACK-001', 'Bubble Wrap Roll 100m',       'Packaging Materials', 200,   18.75, 'PackRight Solutions',   'ACTIVE'],
  ['PACK-002', 'Corrugated Box 12x12x12 in',  'Packaging Materials', 1500,   0.89, 'PackRight Solutions',   'ACTIVE'],
  ['PACK-003', 'Stretch Wrap 20in Clear',     'Packaging Materials',   5,   12.40, 'PackRight Solutions',   'ACTIVE'],   // low-stock
  ['PACK-004', 'Packing Tape 2in x 100yd',   'Packaging Materials', 350,    2.15, 'PackRight Solutions',   'ACTIVE'],
  ['PACK-005', 'Air Pillow Film 8x4in',       'Packaging Materials',   7,    9.80, 'PackRight Solutions',   'ACTIVE'],   // low-stock

  // Safety & PPE (SafetyFirst Inc.)
  ['SAFE-001', 'Nitrile Gloves Box/100',      'Safety & PPE',         80,   14.99, 'SafetyFirst Inc.',      'ACTIVE'],
  ['SAFE-002', 'Safety Goggles EN166',        'Safety & PPE',          6,    8.50, 'SafetyFirst Inc.',      'ACTIVE'],   // low-stock
  ['SAFE-003', 'Hi-Vis Vest Class 2',         'Safety & PPE',         25,   11.20, 'SafetyFirst Inc.',      'ACTIVE'],
  ['SAFE-004', 'Hard Hat Type II White',      'Safety & PPE',          0,   22.00, 'SafetyFirst Inc.',      'DISCONTINUED'],

  // Office Supplies (OfficePro Supplies)
  ['OFFC-001', 'Thermal Label Roll 4x6in',    'Office Supplies',     120,    9.99, 'OfficePro Supplies',    'ACTIVE'],
  ['OFFC-002', 'Printer Paper A4 500-Sheet',  'Office Supplies',     300,    5.49, 'OfficePro Supplies',    'ACTIVE'],
  ['OFFC-003', 'Whiteboard Marker Set 8pc',   'Office Supplies',       2,    6.75, 'OfficePro Supplies',    'ACTIVE'],   // low-stock

  // Industrial Hardware (IndustrialDirect Ltd.)
  ['HWRD-001', 'Pallet Jack 5500 lb',         'Industrial Hardware',   4,  349.00, 'IndustrialDirect Ltd.', 'ACTIVE'],   // low-stock
  ['HWRD-002', 'Steel Shelving Unit 5-Tier',  'Industrial Hardware',  15,  124.50, 'IndustrialDirect Ltd.', 'ACTIVE'],
  ['HWRD-003', 'Cable Ties 100-Pack Mixed',   'Industrial Hardware', 500,    4.25, 'IndustrialDirect Ltd.', 'ACTIVE'],

  // Cleaning Supplies (CleanCo Wholesale)
  ['CLEN-001', 'Industrial Degreaser 5L',     'Cleaning Supplies',     9,   28.90, 'CleanCo Wholesale',     'ACTIVE'],   // low-stock
  ['CLEN-002', 'Microfiber Mop Head 3-Pack',  'Cleaning Supplies',    45,   16.30, 'CleanCo Wholesale',     'ACTIVE'],
  ['CLEN-003', 'Hand Sanitizer 1L Pump',      'Cleaning Supplies',     1,    7.99, 'CleanCo Wholesale',     'ACTIVE'],   // low-stock
];

// ─── Seed runner ──────────────────────────────────────────────────────────────
export async function runSeeds() {
  // ── 1. Users ─────────────────────────────────────────────────────────────────
  let editorId;
  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE SET
         name          = EXCLUDED.name,
         password_hash = EXCLUDED.password_hash,
         role          = EXCLUDED.role,
         is_active     = true,
         updated_at    = NOW()
       RETURNING id`,
      [user.name, user.email, passwordHash, user.role]
    );

    if (user.role === 'EDITOR') {
      editorId = result.rows[0].id;
    }
    console.log(`[seed] Upserted user: ${user.email} (${user.role})`);
  }

  // ── 2. Categories ─────────────────────────────────────────────────────────────
  // categories.name has a UNIQUE index — ON CONFLICT works directly
  const categoryMap = {};
  for (const cat of DEMO_CATEGORIES) {
    const result = await pool.query(
      `INSERT INTO categories (name, description, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description
       RETURNING id, name`,
      [cat.name, cat.description, editorId]
    );
    categoryMap[result.rows[0].name] = result.rows[0].id;
    console.log(`[seed] Upserted category: ${cat.name}`);
  }

  // ── 3. Suppliers ──────────────────────────────────────────────────────────────
  // suppliers.name has a UNIQUE constraint added in migration 004
  const supplierMap = {};
  for (const sup of DEMO_SUPPLIERS) {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_email, phone, address, created_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ON CONSTRAINT suppliers_name_unique DO UPDATE SET
         contact_email = EXCLUDED.contact_email,
         phone         = EXCLUDED.phone,
         address       = EXCLUDED.address
       RETURNING id, name`,
      [sup.name, sup.contact_email, sup.phone, sup.address, editorId]
    );
    supplierMap[result.rows[0].name] = result.rows[0].id;
    console.log(`[seed] Upserted supplier: ${sup.name}`);
  }

  // ── 4. Inventory Items ────────────────────────────────────────────────────────
  // Skip if inventory_items table doesn't exist yet (pre-migration 004 state)
  const tableCheck = await pool.query(
    `SELECT to_regclass('public.inventory_items') AS tbl`
  );
  if (!tableCheck.rows[0].tbl) {
    console.log('[seed] inventory_items table not found — skipping inventory seed');
    return;
  }

  for (const [sku, item_name, category_name, quantity, unit_cost, supplier_name, status] of DEMO_ITEMS) {
    const category_id = categoryMap[category_name];
    const supplier_id = supplierMap[supplier_name];

    if (!category_id) {
      console.warn(`[seed] WARN: category "${category_name}" not found — skipping ${sku}`);
      continue;
    }
    if (!supplier_id) {
      console.warn(`[seed] WARN: supplier "${supplier_name}" not found — skipping ${sku}`);
      continue;
    }

    await pool.query(
      `INSERT INTO inventory_items
         (sku, item_name, category_id, quantity, unit_cost, supplier_id, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7::item_status, $8, $8)
       ON CONFLICT (sku) DO UPDATE SET
         item_name   = EXCLUDED.item_name,
         category_id = EXCLUDED.category_id,
         quantity    = EXCLUDED.quantity,
         unit_cost   = EXCLUDED.unit_cost,
         supplier_id = EXCLUDED.supplier_id,
         status      = EXCLUDED.status,
         updated_by  = EXCLUDED.updated_by,
         updated_at  = NOW()`,
      [sku, item_name, category_id, quantity, unit_cost, supplier_id, status, editorId]
    );
    console.log(`[seed] Upserted item: ${sku} — ${item_name} (qty: ${quantity}, ${status})`);
  }

  console.log('[seed] All seed data applied successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
