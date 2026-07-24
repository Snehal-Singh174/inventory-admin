import { prisma } from '../prisma/client';
import { ConflictError, NotFoundError } from '../utils/errors';

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { name: input.name } });
  if (existing) throw new ConflictError(`Category '${input.name}' already exists`);

  return prisma.category.create({
    data: {
      name: input.name,
      description: input.description || null,
    },
  });
}

export async function updateCategory(id: string, input: Partial<CreateCategoryInput>) {
  await getCategoryById(id);

  if (input.name) {
    const existing = await prisma.category.findFirst({
      where: { name: input.name, NOT: { id } },
    });
    if (existing) throw new ConflictError(`Category '${input.name}' already exists`);
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description || null }),
    },
  });
}

export async function deleteCategory(id: string) {
  await getCategoryById(id);
  const itemCount = await prisma.inventoryItem.count({ where: { categoryId: id, isDeleted: false } });
  if (itemCount > 0) {
    throw new ConflictError(`Cannot delete category with ${itemCount} active item(s)`);
  }
  return prisma.category.delete({ where: { id } });
}
