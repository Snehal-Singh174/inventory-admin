import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg shadow-elevation-2 px-3 py-2">
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-sm font-bold text-primary tabular-nums">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-info)',
  'var(--color-warning)',
  'var(--color-primary-500)',
  'var(--color-secondary-500)',
];

export function DashboardChart({ valueByCategory }) {
  if (!valueByCategory || valueByCategory.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <BarChart3 size={40} className="text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No categories with stock yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first item to see inventory value by category here.
        </p>
      </div>
    );
  }

  const chartData = valueByCategory.map((item) => ({
    name: item.categoryName,
    value: item.totalValue,
  }));

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">Inventory Value by Category</h2>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-accent)', opacity: 0.5 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {chartData.map((_, index) => (
                <Cell key={`bar-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
