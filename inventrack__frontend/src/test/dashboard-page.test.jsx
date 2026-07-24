import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardKpiGrid } from '../components/dashboard/DashboardKpiGrid';
import { DashboardChart } from '../components/dashboard/DashboardChart';
import { DashboardActivityFeed } from '../components/dashboard/DashboardActivityFeed';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';

// Mock recharts to avoid rendering issues in test
vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Cell: () => null,
}));

const mockData = {
  totalValue: 245890.5,
  activeSkus: 312,
  lowStockCount: 18,
  discontinuedCount: 7,
  categoryCount: 9,
};

const mockValueByCategory = [
  { categoryId: 'cat-1', categoryName: 'Electronics', totalValue: 89500 },
  { categoryId: 'cat-2', categoryName: 'Office Supplies', totalValue: 34200 },
];

const mockActivities = [
  {
    id: 'act-1',
    action: 'create',
    entityType: 'InventoryItem',
    entityName: 'Wireless Mouse X200',
    performer: { fullName: 'Aisha Patel' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'act-2',
    action: 'update',
    entityType: 'InventoryItem',
    entityName: 'USB-C Hub',
    performer: { fullName: 'Marcus Lee' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Dashboard KPI Grid', () => {
  it('renders all 5 KPI cards with correct values', () => {
    renderWithRouter(<DashboardKpiGrid data={mockData} />);
    expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
    expect(screen.getByText('$245,891')).toBeInTheDocument();
    expect(screen.getByText('Active SKUs')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Discontinued Items')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Categories Tracked')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('applies red alert tint when low stock count > 0', () => {
    renderWithRouter(<DashboardKpiGrid data={mockData} />);
    const lowStockButton = screen.getByLabelText(/low stock items/i);
    expect(lowStockButton.className).toContain('bg-error');
  });
});

describe('Dashboard Chart', () => {
  it('renders empty state when no categories', () => {
    render(<DashboardChart valueByCategory={[]} />);
    expect(screen.getByText('No categories with stock yet')).toBeInTheDocument();
  });

  it('renders bar chart when data exists', () => {
    render(<DashboardChart valueByCategory={mockValueByCategory} />);
    expect(screen.getByText('Inventory Value by Category')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});

describe('Dashboard Activity Feed', () => {
  it('renders empty state when no activities', () => {
    render(<DashboardActivityFeed activities={[]} onViewAll={() => {}} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders activity entries with actor and entity', () => {
    render(<DashboardActivityFeed activities={mockActivities} onViewAll={() => {}} />);
    expect(screen.getByText('Aisha Patel')).toBeInTheDocument();
    expect(screen.getByText('Marcus Lee')).toBeInTheDocument();
    expect(screen.getByText('View full audit log')).toBeInTheDocument();
  });
});

describe('Dashboard Skeleton', () => {
  it('renders skeleton for Editor (includes activity feed skeleton)', () => {
    const { container } = render(<DashboardSkeleton isEditor={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders skeleton for Viewer (no activity feed skeleton)', () => {
    const { container } = render(<DashboardSkeleton isEditor={false} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});
