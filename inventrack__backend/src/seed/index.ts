import { prisma } from '../prisma/client';
import { hashPassword } from '../utils/password';

const DEMO_USERS = [
  {
    email: 'editor@inventrack.dev',
    password: 'Editor123!',
    fullName: 'Demo Editor',
    role: 'Editor',
  },
  {
    email: 'viewer@inventrack.dev',
    password: 'Viewer123!',
    fullName: 'Demo Viewer',
    role: 'Viewer',
  },
];

const SEED_CATEGORIES = [
  { name: 'Electronics', description: 'Electronic devices and components' },
  { name: 'Office Supplies', description: 'General office supplies and stationery' },
  { name: 'Raw Materials', description: 'Manufacturing raw materials' },
  { name: 'Packaging', description: 'Packaging materials and containers' },
  { name: 'Furniture', description: 'Office and warehouse furniture' },
];

const SEED_SUPPLIERS = [
  { name: 'TechParts Inc.', contactEmail: 'sales@techparts.io', phone: '+1-555-0101' },
  { name: 'OfficeMax Supply Co.', contactEmail: 'orders@officemax-supply.com', phone: '+1-555-0202' },
  { name: 'Global Raw Ltd.', contactEmail: 'bulk@globalraw.co', phone: '+1-555-0303' },
  { name: 'PackWell Industries', contactEmail: 'info@packwell.com', phone: '+1-555-0404' },
  { name: 'FurnishPro', contactEmail: 'support@furnishpro.com', phone: '+1-555-0505' },
];

export async function seedDemoUsers(): Promise<void> {
  console.log('[Seed] Starting demo user seed...');

  for (const user of DEMO_USERS) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: user.email } });
      if (existing) {
        console.log(`[Seed] User ${user.email} already exists, skipping.`);
        continue;
      }

      const passwordHash = await hashPassword(user.password);
      await prisma.user.create({
        data: {
          email: user.email,
          passwordHash,
          fullName: user.fullName,
          role: user.role,
          isActive: true,
        },
      });
      console.log(`[Seed] Created user: ${user.email} (role: ${user.role})`);
    } catch (err) {
      console.error(`[Seed] Failed to seed user ${user.email}:`, err);
    }
  }

  console.log('[Seed] Demo user seed complete.');
}

export async function seedCategories(): Promise<void> {
  console.log('[Seed] Seeding categories...');
  for (const cat of SEED_CATEGORIES) {
    try {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: { name: cat.name, description: cat.description },
      });
      console.log(`[Seed] Category '${cat.name}' ready.`);
    } catch (err) {
      console.error(`[Seed] Failed to seed category '${cat.name}':`, err);
    }
  }
}

export async function seedSuppliers(): Promise<void> {
  console.log('[Seed] Seeding suppliers...');
  for (const sup of SEED_SUPPLIERS) {
    try {
      await prisma.supplier.upsert({
        where: { name: sup.name },
        update: {},
        create: { name: sup.name, contactEmail: sup.contactEmail, phone: sup.phone },
      });
      console.log(`[Seed] Supplier '${sup.name}' ready.`);
    } catch (err) {
      console.error(`[Seed] Failed to seed supplier '${sup.name}':`, err);
    }
  }
}

export async function seedInventoryItems(): Promise<void> {
  console.log('[Seed] Seeding inventory items...');

  const editor = await prisma.user.findUnique({ where: { email: 'editor@inventrack.dev' } });
  if (!editor) {
    console.error('[Seed] Editor user not found, skipping inventory items.');
    return;
  }

  const categories = await prisma.category.findMany();
  const suppliers = await prisma.supplier.findMany();
  if (categories.length === 0 || suppliers.length === 0) {
    console.error('[Seed] Categories or suppliers missing, skipping inventory items.');
    return;
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const supMap = Object.fromEntries(suppliers.map((s) => [s.name, s.id]));

  const SEED_ITEMS = [
    { itemName: 'Wireless Keyboard', sku: 'ELEC-001', category: 'Electronics', quantity: 150, unitCost: 29.99, supplier: 'TechParts Inc.', status: 'Active', reorderPoint: 20 },
    { itemName: 'USB-C Hub Adapter', sku: 'ELEC-002', category: 'Electronics', quantity: 75, unitCost: 45.50, supplier: 'TechParts Inc.', status: 'Active', reorderPoint: 15 },
    { itemName: 'A4 Copy Paper (500 sheets)', sku: 'OFF-001', category: 'Office Supplies', quantity: 500, unitCost: 4.99, supplier: 'OfficeMax Supply Co.', status: 'Active', reorderPoint: 100 },
    { itemName: 'Ballpoint Pen Box (50)', sku: 'OFF-002', category: 'Office Supplies', quantity: 200, unitCost: 12.00, supplier: 'OfficeMax Supply Co.', status: 'Active', reorderPoint: 30 },
    { itemName: 'Steel Sheet 1mm (1x2m)', sku: 'RAW-001', category: 'Raw Materials', quantity: 40, unitCost: 85.00, supplier: 'Global Raw Ltd.', status: 'Active', reorderPoint: 10 },
    { itemName: 'Copper Wire 2.5mm (100m)', sku: 'RAW-002', category: 'Raw Materials', quantity: 5, unitCost: 120.00, supplier: 'Global Raw Ltd.', status: 'Discontinued', reorderPoint: 8 },
    { itemName: 'Cardboard Box Medium', sku: 'PKG-001', category: 'Packaging', quantity: 1000, unitCost: 1.25, supplier: 'PackWell Industries', status: 'Active', reorderPoint: 200 },
    { itemName: 'Bubble Wrap Roll (50m)', sku: 'PKG-002', category: 'Packaging', quantity: 30, unitCost: 18.50, supplier: 'PackWell Industries', status: 'Active', reorderPoint: 10 },
    { itemName: 'Ergonomic Office Chair', sku: 'FUR-001', category: 'Furniture', quantity: 12, unitCost: 349.99, supplier: 'FurnishPro', status: 'Active', reorderPoint: 3 },
    { itemName: 'Standing Desk 160cm', sku: 'FUR-002', category: 'Furniture', quantity: 8, unitCost: 599.00, supplier: 'FurnishPro', status: 'Active', reorderPoint: 2 },
  ];

  for (const item of SEED_ITEMS) {
    try {
      const existing = await prisma.inventoryItem.findFirst({ where: { sku: item.sku } });
      if (existing) {
        console.log(`[Seed] Item '${item.sku}' already exists, skipping.`);
        continue;
      }

      await prisma.inventoryItem.create({
        data: {
          itemName: item.itemName,
          sku: item.sku,
          categoryId: catMap[item.category],
          quantity: item.quantity,
          unitCost: item.unitCost,
          supplierId: supMap[item.supplier],
          status: item.status,
          reorderPoint: item.reorderPoint,
          createdBy: editor.id,
          updatedBy: editor.id,
        },
      });
      console.log(`[Seed] Created item: ${item.sku} - ${item.itemName}`);
    } catch (err) {
      console.error(`[Seed] Failed to seed item '${item.sku}':`, err);
    }
  }

  console.log('[Seed] Inventory items seed complete.');
}

export async function seedAll(): Promise<void> {
  await seedDemoUsers();
  await seedCategories();
  await seedSuppliers();
  await seedInventoryItems();
}
