/* SCREEN PLAN: Categories & Suppliers (Reference Data)
 * Grid: No bento grid — tabbed settings screen, flat layout
 * Sections (in order):
 *   1. Permission guard — full-page 403 for role !== EDITOR
 *   2. Page header — h1 "Reference Data" + subtitle
 *   3. Tab bar — "Categories" (default, no param) | "Suppliers" (?tab=suppliers)
 *   4. Active tab panel — delegates to CategoryTab / SupplierTab
 * States: loading/error/empty/success delegated per tab component
 * Copy: "Reference Data" / "Manage the categories and suppliers used across your inventory"
 *       403: "You don't have permission to view this page."
 * Slop risks:
 *   - Generic "Access Denied" copy → domain-specific restriction message
 *   - Tab switch causing page reload → URL param, no reload
 *   - No aria on tab bar → role="tablist", role="tab", aria-selected
 *   - Icon-only Back button → labeled "Back to Inventory"
 */

import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Database, ShieldOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';
import { CategoryTab } from './CategoryTab';
import { SupplierTab } from './SupplierTab';

type TabKey = 'categories' | 'suppliers';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'categories', label: 'Categories' },
  { key: 'suppliers',  label: 'Suppliers'  },
];

export function ReferenceData() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Permission guard: Viewers see a full-page 403 state ────────────────────
  if (user?.role !== 'EDITOR') {
    return <PermissionDenied />;
  }

  const raw       = searchParams.get('tab') ?? 'categories';
  const activeTab = (TABS.some(t => t.key === raw) ? raw : 'categories') as TabKey;

  const handleTabChange = (key: TabKey) => {
    if (key === 'categories') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: key });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center
                     flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <Database size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-onBackground">Reference Data</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage the categories and suppliers used across your inventory
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border -mb-6">
        <div role="tablist" aria-label="Reference data sections" className="flex">
          {TABS.map(({ key, label }) => (
            <button
              key={`ref-tab-${key}`}
              role="tab"
              aria-selected={activeTab === key}
              aria-controls={`tabpanel-${key}`}
              id={`tab-btn-${key}`}
              onClick={() => handleTabChange(key)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-onBackground hover:border-border',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active tab panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-btn-${activeTab}`}
      >
        {activeTab === 'categories' ? <CategoryTab /> : <SupplierTab />}
      </div>
    </div>
  );
}

// ── Permission-denied state ───────────────────────────────────────────────────

function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-errorBackground flex items-center justify-center">
        <ShieldOff size={28} className="text-error" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-onBackground">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          You don't have permission to view this page. Reference data management
          is restricted to Editors only.
        </p>
      </div>
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-onPrimary
                   text-sm font-semibold hover:bg-primary/90 transition-colors duration-150
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   focus-visible:ring-offset-2 min-h-[44px]"
      >
        Back to Inventory
      </Link>
    </div>
  );
}
