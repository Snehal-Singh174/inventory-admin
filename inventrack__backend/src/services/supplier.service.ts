import { prisma } from '../prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors';

export interface CreateSupplierInput {
  name: string;
  contactEmail?: string;
  phone?: string;
}

export async function getAllSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new NotFoundError('Supplier not found');
  return supplier;
}

export async function createSupplier(input: CreateSupplierInput) {
  const existing = await prisma.supplier.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError(`Supplier '${input.name}' already exists`);

  return prisma.supplier.create({
    data: {
      name: input.name,
      contactEmail: input.contactEmail || null,
      phone: input.phone || null,
    },
  });
}

export async function updateSupplier(id: string, input: Partial<CreateSupplierInput>) {
  await getSupplierById(id);

  if (input.name) {
    const existing = await prisma.supplier.findFirst({
      where: { name: input.name, NOT: { id } },
    });
    if (existing) throw new ConflictError(`Supplier '${input.name}' already exists`);
  }

  return prisma.supplier.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.contactEmail !== undefined && { contactEmail: input.contactEmail || null }),
      ...(input.phone !== undefined && { phone: input.phone || null }),
    },
  });
}

export async function deleteSupplier(id: string) {
  await getSupplierById(id);
  const itemCount = await prisma.inventoryItem.count({ where: { supplierId: id, isDeleted: false } });
  if (itemCount > 0) {
    throw new ConflictError(`Cannot delete supplier with ${itemCount} active item(s)`);
  }
  return prisma.supplier.delete({ where: { id } });
}
