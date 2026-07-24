import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuditTable } from '../components/audit/AuditTable';
import { AuditFilters } from '../components/audit/AuditFilters';

const mockEntries = [
  {
    id: 'audit-1',
    action: 'update',
    entityType: 'InventoryItem',
    entityName: 'Wireless Keyboard K300',
    performer: { fullName: 'Aisha Patel' },
    createdAt: '2026-07-20T14:30:00Z',
    summary: 'Updated quantity and unit_cost',
    beforeValues: { quantity: '50', unit_cost: '24.99' },
    afterValues: { quantity: '75', unit_cost: '22.50' },
  },
  {
    id: 'audit-2',
    action: 'create',
    entityType: 'InventoryItem',
    entityName: 'USB-C Hub Pro',
    performer: { fullName: 'Marcus Lee' },
    createdAt: '2026-07-19T09:15:00Z',
    summary: 'Created inventory item',
    beforeValues: null,
    afterValues: { item_name: 'USB-C Hub Pro', quantity: '100', status: 'Active' },
  },
  {
    id: 'audit-3',
    action: 'delete',
    entityType: 'InventoryItem',
    entityName: 'Old Mouse',
    performer: { fullName: 'Aisha Patel' },
    createdAt: '2026-07-18T16:00:00Z',
    summary: 'Deleted inventory item',
    beforeValues: { item_name: 'Old Mouse', status: 'Discontinued' },
    afterValues: null,
  },
];

describe('AuditTable', () => {
  it('renders all audit entries with correct columns', () => {
    render(<AuditTable entries={mockEntries} />);
    expect(screen.getAllByText('Aisha Patel').length).toBe(2);
    expect(screen.getByText('Marcus Lee')).toBeInTheDocument();
    expect(screen.getByText(/Wireless Keyboard K300/)).toBeInTheDocument();
    expect(screen.getByText(/USB-C Hub Pro/)).toBeInTheDocument();
  });

  it('shows colored action badges', () => {
    render(<AuditTable entries={mockEntries} />);
    const badges = screen.getAllByText(/update|create|delete/i);
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it('expands row to show diff panel on click', () => {
    render(<AuditTable entries={mockEntries} />);
    const firstRow = screen.getAllByText('Aisha Patel')[0].closest('tr');
    fireEvent.click(firstRow);
    // After expansion, before/after values should be visible
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('collapses expanded row on second click', () => {
    render(<AuditTable entries={mockEntries} />);
    const firstRow = screen.getAllByText('Aisha Patel')[0].closest('tr');
    fireEvent.click(firstRow);
    expect(screen.getByText('Before')).toBeInTheDocument();
    fireEvent.click(firstRow);
    expect(screen.queryByText('Before')).not.toBeInTheDocument();
  });
});

describe('AuditFilters', () => {
  it('renders all filter controls', () => {
    const filters = { entityType: '', action: '', userId: '', dateFrom: '', dateTo: '' };
    render(
      <AuditFilters
        filters={filters}
        onFilterChange={() => {}}
        hasActiveFilters={false}
        onClear={() => {}}
      />
    );
    expect(screen.getByLabelText('Filter by entity type')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by action')).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
  });

  it('shows Clear filters button when filters are active', () => {
    const filters = { entityType: 'InventoryItem', action: '', userId: '', dateFrom: '', dateTo: '' };
    render(
      <AuditFilters
        filters={filters}
        onFilterChange={() => {}}
        hasActiveFilters={true}
        onClear={() => {}}
      />
    );
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('calls onFilterChange when entity type is selected', () => {
    const onFilterChange = vi.fn();
    const filters = { entityType: '', action: '', userId: '', dateFrom: '', dateTo: '' };
    render(
      <AuditFilters
        filters={filters}
        onFilterChange={onFilterChange}
        hasActiveFilters={false}
        onClear={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText('Filter by entity type'), { target: { value: 'User' } });
    expect(onFilterChange).toHaveBeenCalledWith({ entityType: 'User' });
  });
});
