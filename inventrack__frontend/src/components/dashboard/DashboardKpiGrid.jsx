import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Package,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';
import { cn } from '../../utils/cn';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiCard({ label, value, icon: Icon, className, iconClassName, onClick, ariaLabel }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={cn(
        'bg-surface border border-border rounded-lg p-5 text-left transition-all duration-150',
        onClick && 'hover:shadow-elevation-1 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground tabular-nums leading-tight">
            {value}
          </p>
        </div>
        <div className={cn('p-2 rounded-lg', iconClassName)}>
          <Icon size={20} />
        </div>
      </div>
    </Tag>
  );
}

export function DashboardKpiGrid({ data }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-3 gap-4">
      {/* Row 1: Hero (spans 2) + Active SKUs */}
      <KpiCard
        label="Total Inventory Value"
        value={formatCurrency(data.totalValue)}
        icon={DollarSign}
        className="md:col-span-2 bg-primary/5 border-primary/20"
        iconClassName="bg-primary/10 text-primary"
      />
      <KpiCard
        label="Active SKUs"
        value={data.activeSkus.toLocaleString()}
        icon={Package}
        iconClassName="bg-info/10 text-info"
      />
      {/* Row 2: Low Stock (alert) + Discontinued + Categories */}
      <KpiCard
        label="Low Stock Items"
        value={data.lowStockCount.toLocaleString()}
        icon={AlertTriangle}
        className={cn(
          data.lowStockCount > 0 && 'bg-error/5 border-error/20'
        )}
        iconClassName={cn(
          data.lowStockCount > 0 ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
        )}
        onClick={() => navigate('/inventory?status=Low+Stock')}
        ariaLabel={`${data.lowStockCount} low stock items — click to view`}
      />
      <KpiCard
        label="Discontinued Items"
        value={data.discontinuedCount.toLocaleString()}
        icon={XCircle}
        iconClassName="bg-muted text-muted-foreground"
      />
      <KpiCard
        label="Categories Tracked"
        value={data.categoryCount.toLocaleString()}
        icon={Layers}
        iconClassName="bg-secondary/10 text-secondary"
      />
    </div>
  );
}
