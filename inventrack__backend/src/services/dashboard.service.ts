import { prisma } from '../prisma/client';
import { Prisma } from '@prisma/client';

export interface DashboardSummary {
  totalValue: number;
  activeSkus: number;
  lowStockCount: number;
  discontinuedCount: number;
  categoryCount: number;
  valueByCategory: { categoryId: string; categoryName: string; totalValue: number }[];
  recentActivity: unknown[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Active items (not deleted, status Active)
  const activeItems = await prisma.inventoryItem.findMany({
    where: { isDeleted: false, status: 'Active' },
    select: { quantity: true, unitCost: true, categoryId: true, reorderPoint: true },
  });

  const totalValue = activeItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitCost),
    0
  );

  const activeSkus = activeItems.length;

  const lowStockCount = activeItems.filter(
    (item) => item.quantity <= item.reorderPoint
  ).length;

  const discontinuedCount = await prisma.inventoryItem.count({
    where: { isDeleted: false, status: 'Discontinued' },
  });

  const categoryCount = await prisma.category.count();

  // Value by category
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const valueByCategoryMap = new Map<string, number>();
  for (const item of activeItems) {
    const current = valueByCategoryMap.get(item.categoryId) || 0;
    valueByCategoryMap.set(item.categoryId, current + item.quantity * Number(item.unitCost));
  }

  const valueByCategory = Array.from(valueByCategoryMap.entries())
    .map(([categoryId, totalValue]) => ({
      categoryId,
      categoryName: catMap.get(categoryId) || 'Unknown',
      totalValue: Math.round(totalValue * 100) / 100,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  // Recent activity (last 8 audit entries)
  const recentActivity = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: {
      performer: { select: { id: true, fullName: true, email: true } },
    },
  });

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    activeSkus,
    lowStockCount,
    discontinuedCount,
    categoryCount,
    valueByCategory,
    recentActivity,
  };
}
