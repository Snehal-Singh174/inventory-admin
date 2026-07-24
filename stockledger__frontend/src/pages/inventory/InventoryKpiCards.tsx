/* SCREEN PLAN: Inventory KPI Cards
 * Grid: 4 cards — grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
 * Cards: Total SKUs (info, hero), Active SKUs (success), Low Stock ≤10 (warning), Discontinued (muted)
 * States: loading skeleton (same shape), success with real counts
 * Slop risks: uniform cards → semantic tints, hero metric larger, no "Revenue/Users/Orders"
 */

import React from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useInventoryKpis } from '../../hooks/useInventoryData';
import { cn } from '../../utils/cn';

interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tintClass: string;
  iconBgClass: string;
  valueClass?: string;
  hero?: boolean;
}

function KpiCard({ label, value, icon, tintClass, iconBgClass, valueClass, hero }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border p-5 flex flex-col gap-3',
        tintClass,
        hero && 'shadow-elevation-2',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground select-none">
          {label}
        </p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBgClass)}>
          {icon}
        </div>
      </div>
      <p className={cn('tabular-nums font-bold leading-none', valueClass ?? 'text-3xl text-onBackground')}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function KpiSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`kpi-skel-${i}`}
          className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-3"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton w-9 h-9 rounded-lg" />
          </div>
          <div className="skeleton h-8 w-16 rounded" />
        </div>
      ))}
    </>
  );
}

export function InventoryKpiCards() {
  const { totalSkus, activeSkus, lowStockItems, discontinuedSkus, isLoading } = useInventoryKpis();

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <KpiSkeleton count={4} />
      ) : (
        <>
          {/* Hero: Total SKUs — slightly elevated treatment */}
          <KpiCard
            label="Total SKUs"
            value={totalSkus}
            hero
            tintClass="bg-infoBackground"
            iconBgClass="bg-info/10"
            valueClass="text-4xl font-extrabold text-info"
            icon={<Package size={18} className="text-info" />}
          />
          {/* Active SKUs — success tint */}
          <KpiCard
            label="Active SKUs"
            value={activeSkus}
            tintClass="bg-successBackground"
            iconBgClass="bg-success/10"
            valueClass="text-3xl font-bold text-success"
            icon={<CheckCircle2 size={18} className="text-success" />}
          />
          {/* Low Stock Alert — warning tint */}
          <KpiCard
            label="Low Stock (≤ 10)"
            value={lowStockItems}
            tintClass={lowStockItems > 0 ? 'bg-warningBackground' : 'bg-surface'}
            iconBgClass={lowStockItems > 0 ? 'bg-warning/10' : 'bg-muted'}
            valueClass={cn('text-3xl font-bold', lowStockItems > 0 ? 'text-warning' : 'text-muted-foreground')}
            icon={
              <AlertTriangle
                size={18}
                className={lowStockItems > 0 ? 'text-warning' : 'text-muted-foreground'}
              />
            }
          />
          {/* Discontinued */}
          <KpiCard
            label="Discontinued"
            value={discontinuedSkus}
            tintClass="bg-surface"
            iconBgClass="bg-muted"
            valueClass="text-3xl font-bold text-muted-foreground"
            icon={<XCircle size={18} className="text-muted-foreground" />}
          />
        </>
      )}
    </div>
  );
}
