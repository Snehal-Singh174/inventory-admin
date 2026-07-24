import ExcelJS from 'exceljs';
import { getFilteredItemsForExport, GetInventoryParams } from './inventory.service';

export async function generateInventoryExcel(params: GetInventoryParams): Promise<Buffer> {
  const items = await getFilteredItemsForExport(params);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InvenTrack';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventory');

  sheet.columns = [
    { header: 'Item Name', key: 'itemName', width: 30 },
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit Cost', key: 'unitCost', width: 12 },
    { header: 'Total Value', key: 'totalValue', width: 15 },
    { header: 'Supplier', key: 'supplier', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Reorder Point', key: 'reorderPoint', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  for (const item of items) {
    const unitCost = Number(item.unitCost);
    sheet.addRow({
      itemName: item.itemName,
      sku: item.sku,
      category: item.category.name,
      quantity: item.quantity,
      unitCost,
      totalValue: item.quantity * unitCost,
      supplier: item.supplier.name,
      status: item.status,
      reorderPoint: item.reorderPoint,
      createdAt: item.createdAt.toISOString(),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
