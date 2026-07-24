/* SCREEN PLAN: Dashboard Overview
 * Grid: 5 KPI cards → row 1: hero (Total Inventory Value) spans 2 cols + Active SKUs; row 2: Low Stock (alert red), Discontinued, Categories Tracked
 * Sections: Page Header → KPI Bento → Category Value Chart → Activity Feed (Editor only)
 * States: loading skeleton bento + chart skeleton + feed skeleton / error alert + retry / empty (0 items, chart shows "No categories") / success
 * Copy: "Dashboard", "Inventory health at a glance", "No categories with stock yet. Add your first item to see it here.", "Failed to load dashboard. Check your connection and try again."
 * Slop risks: Uniform KPI cards (need hero dominant), generic metrics, chart with fake data, activity feed without domain context
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/auth-context';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardKpiGrid } from '../components/dashboard/DashboardKpiGrid';
import { DashboardChart } from '../components/dashboard/DashboardChart';
import { DashboardActivityFeed } from '../components/dashboard/DashboardActivityFeed';
import { DashboardSkeleton } from '../components/dashboard/DashboardSkeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

export function DashboardPage() {
  const { user } = useAuth();
  const { state, retry } = useDashboard();
  const navigate = useNavigate();
  const isEditor = user?.role === 'Editor';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-screen-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inventory health at a glance
          </p>
        </div>

        {state.status === 'loading' && <DashboardSkeleton isEditor={isEditor} />}

        {state.status === 'error' && (
          <div className="bg-errorBackground border border-error/20 rounded-lg p-6 flex items-start gap-3" role="alert">
            <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-error">
                Failed to load dashboard. Check your connection and try again.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={retry} className="flex-shrink-0">
              <RefreshCw size={14} className="mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {state.status === 'success' && (
          <div className="space-y-6 animate-fade-in">
            <DashboardKpiGrid data={state.data} />
            <DashboardChart valueByCategory={state.data.valueByCategory} />
            {isEditor && (
              <DashboardActivityFeed
                activities={state.data.recentActivity}
                onViewAll={() => navigate('/audit-log')}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
