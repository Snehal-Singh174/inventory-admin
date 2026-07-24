import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

const mockUser = { id: '1', fullName: 'Test Editor', email: 'editor@inventrack.dev', role: 'Editor' };
const mockViewerUser = { id: '2', fullName: 'Test Viewer', email: 'viewer@inventrack.dev', role: 'Viewer' };

const mockUseAuth = vi.fn(() => ({
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../context/auth-context', () => ({
  useAuth: (...args) => mockUseAuth(...args),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../utils/api-client', () => {
  class ApiError extends Error {
    constructor(message, status, code) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.code = code;
    }
  }
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    getBlob: vi.fn(),
  };
  return { apiClient, ApiError, default: apiClient };
});

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { InventoryPage } from '../pages/InventoryPage';
import { apiClient, ApiError } from '../utils/api-client';
import { toast } from 'sonner';

const mockInventoryResponse = {
  data: [
    { id: 'item-1', itemName: 'Wireless Barcode Scanner', sku: 'WBS-2200', categoryId: 'cat-1', categoryName: 'Electronics', quantity: 45, unitCost: 189.99, supplierId: 'sup-1', supplierName: 'TechParts Co', status: 'Active', reorderPoint: 10, updatedAt: '2026-07-20T10:00:00.000Z' },
    { id: 'item-2', itemName: 'Packing Tape Roll', sku: 'PTR-100', categoryId: 'cat-2', categoryName: 'Packaging', quantity: 5, unitCost: 3.49, supplierId: 'sup-2', supplierName: 'PackSupply Inc', status: 'Active', reorderPoint: 20, updatedAt: '2026-07-18T15:30:00.000Z' },
    { id: 'item-3', itemName: 'Industrial Shelving Unit', sku: 'ISU-500', categoryId: 'cat-3', categoryName: 'Furniture', quantity: 12, unitCost: 450.00, supplierId: 'sup-3', supplierName: 'MetalWorks Ltd', status: 'Discontinued', reorderPoint: null, updatedAt: '2026-07-15T08:00:00.000Z' },
  ],
  meta: { totalCount: 3, page: 1, limit: 25, totalPages: 1 },
};

const mockCategories = { data: [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Packaging' },
  { id: 'cat-3', name: 'Furniture' },
] };

const mockSuppliers = { data: [
  { id: 'sup-1', name: 'TechParts Co' },
  { id: 'sup-2', name: 'PackSupply Inc' },
  { id: 'sup-3', name: 'MetalWorks Ltd' },
] };

function setupMocks() {
  apiClient.get.mockImplementation((url) => {
    if (url.includes('/api/v1/inventory')) return Promise.resolve(mockInventoryResponse);
    if (url.includes('/api/v1/categories')) return Promise.resolve(mockCategories);
    if (url.includes('/api/v1/suppliers')) return Promise.resolve(mockSuppliers);
    return Promise.resolve({ data: [] });
  });
}

function renderPage() {
  return render(<BrowserRouter><InventoryPage /></BrowserRouter>);
}

async function waitForTableLoaded() {
  await waitFor(() => expect(screen.getByText('Wireless Barcode Scanner')).toBeInTheDocument());
}

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() });
    setupMocks();
  });

  it('renders page title and inventory items', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByRole('heading', { level: 1, name: 'Inventory' })).toBeInTheDocument();
    expect(screen.getByText('3 items')).toBeInTheDocument();
    expect(screen.getByText('Packing Tape Roll')).toBeInTheDocument();
    expect(screen.getByText('Industrial Shelving Unit')).toBeInTheDocument();
  });

  it('renders sortable column headers with sort arrows', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByLabelText('Sort by Item Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by SKU')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by Unit Cost')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by Last Updated')).toBeInTheDocument();
  });

  it('calls API with sort param when column header clicked', async () => {
    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getByLabelText('Sort by Item Name'));
    await waitFor(() => {
      const inventoryCalls = apiClient.get.mock.calls.filter(c => c[0].includes('/api/v1/inventory'));
      expect(inventoryCalls.some(c => c[0].includes('sortBy=itemName'))).toBe(true);
    });
  });

  it('shows low stock badge for items at or below reorder point', async () => {
    renderPage();
    await waitForTableLoaded();
    // item-2 has qty=5, reorderPoint=20, so it's low stock
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('renders filter toolbar with search, status, quantity range', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByPlaceholderText('Search by name or SKU…')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum quantity')).toBeInTheDocument();
  });

  it('renders pagination with correct info and page size options', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByText(/Showing 1–3 of 3 items/)).toBeInTheDocument();
    const select = screen.getByLabelText('Per page:');
    const options = within(select).getAllByRole('option');
    expect(options.map(o => o.value)).toEqual(['25', '50', '100']);
  });

  it('shows Editor controls: Add Item, checkboxes, row actions', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getAllByRole('button', { name: /Add Item/i }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Select all rows')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Wireless Barcode Scanner')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Wireless Barcode Scanner')).toBeInTheDocument();
  });

  it('hides Editor controls for Viewer role', async () => {
    mockUseAuth.mockReturnValue({ user: mockViewerUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() });
    renderPage();
    await waitForTableLoaded();
    expect(screen.queryAllByRole('button', { name: /Add Item/i })).toHaveLength(0);
    expect(screen.queryByLabelText('Select all rows')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Edit Wireless Barcode Scanner')).not.toBeInTheDocument();
  });

  it('shows bulk action bar when rows are selected', async () => {
    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getByLabelText('Select Wireless Barcode Scanner'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toBeInTheDocument();
  });

  it('enters inline edit mode on edit icon click', async () => {
    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getByLabelText('Edit Wireless Barcode Scanner'));
    await waitFor(() => {
      expect(screen.getByLabelText('Save changes')).toBeInTheDocument();
      expect(screen.getByLabelText('Cancel editing')).toBeInTheDocument();
    });
  });

  it('triggers export and shows success toast', async () => {
    const mockBlob = new Blob(['data'], { type: 'application/octet-stream' });
    apiClient.getBlob.mockResolvedValue(mockBlob);
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();

    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getByLabelText('Export inventory to Excel'));
    await waitFor(() => {
      expect(apiClient.getBlob).toHaveBeenCalledWith(expect.stringContaining('/api/v1/inventory/export'));
      expect(toast.success).toHaveBeenCalledWith('Export ready — check your downloads');
    });
  });

  it('shows empty state when no items exist', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/api/v1/inventory')) return Promise.resolve({ data: [], meta: { totalCount: 0, page: 1, limit: 25, totalPages: 0 } });
      if (url.includes('/api/v1/categories')) return Promise.resolve(mockCategories);
      if (url.includes('/api/v1/suppliers')) return Promise.resolve(mockSuppliers);
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No inventory items yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first item to get started tracking your inventory.')).toBeInTheDocument();
    });
  });

  it('shows error state with retry on API failure', async () => {
    apiClient.get.mockImplementation((url) => {
      if (url.includes('/api/v1/inventory')) return Promise.reject(new ApiError('Network error', 0, 'NETWORK'));
      if (url.includes('/api/v1/categories')) return Promise.resolve(mockCategories);
      if (url.includes('/api/v1/suppliers')) return Promise.resolve(mockSuppliers);
      return Promise.resolve({ data: [] });
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });

  it('renders column visibility toggle', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByLabelText('Toggle column visibility')).toBeInTheDocument();
  });

  it('shows Export button', async () => {
    renderPage();
    await waitForTableLoaded();
    expect(screen.getByLabelText('Export inventory to Excel')).toBeInTheDocument();
  });
});

describe('AddEditItemModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, token: 'tok', isAuthenticated: true, login: vi.fn(), logout: vi.fn() });
    setupMocks();
  });

  it('opens modal with form fields when Add Item clicked', async () => {
    renderPage();
    await waitForTableLoaded();
    const btns = screen.getAllByRole('button', { name: /Add Item/i });
    fireEvent.click(btns[0]);
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Item Name/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/SKU/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Category/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Quantity/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Unit Cost/)).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/Supplier/)).toBeInTheDocument();
    });
  });

  it('validates required fields on submit', async () => {
    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getAllByRole('button', { name: /Add Item/i })[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // The submit button in the modal footer
    const dialog = screen.getByRole('dialog');
    const submitBtn = within(dialog).getByRole('button', { name: /^Add Item$/ });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Item name is required')).toBeInTheDocument();
    });
  });

  it('shows reorder point behind More options disclosure', async () => {
    renderPage();
    await waitForTableLoaded();
    fireEvent.click(screen.getAllByRole('button', { name: /Add Item/i })[0]);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByText('More options'));
    await waitFor(() => {
      expect(screen.getByLabelText(/Reorder Point/)).toBeInTheDocument();
      expect(screen.getByText('Items at or below this quantity show a Low Stock badge')).toBeInTheDocument();
    });
  });
});
