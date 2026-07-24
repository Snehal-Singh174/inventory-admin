import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScrollText,
  Database,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  path: string;
  Icon: LucideIcon;
  editorOnly?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Inventory', path: '/inventory', Icon: LayoutDashboard },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Audit Log',       path: '/audit-log',       Icon: ScrollText,  editorOnly: true },
  { label: 'Reference Data',  path: '/settings/reference-data',  Icon: Database,    editorOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.path}
      to={item.path}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        'nav-item group relative',
        collapsed ? 'justify-center px-2' : 'px-3',
        isActive(item.path) && 'nav-item-active',
      )}
    >
      {/* Active indicator bar */}
      {isActive(item.path) && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
        />
      )}
      <item.Icon
        size={18}
        strokeWidth={isActive(item.path) ? 2.5 : 2}
      />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <span
          aria-hidden="true"
          className="absolute left-full ml-3 z-50 px-2 py-1 rounded bg-onBackground text-surface
                     text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none
                     group-hover:opacity-100 transition-opacity duration-150"
        >
          {item.label}
        </span>
      )}
    </NavLink>
  );

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <aside
      className={cn(
        'sidebar-transition fixed top-0 left-0 h-screen bg-sidebar flex flex-col z-40',
        'border-r border-sidebarBorder shadow-sidebar',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          'flex items-center h-14 flex-shrink-0 border-b border-sidebarBorder px-3',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <BarChart3 size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-sidebarTextActive font-bold text-base tracking-tight">
            StockLedger
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1"
        aria-label="Main navigation"
      >
        {/* Main section */}
        {!collapsed && (
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-sidebarGroup select-none">
            Main
          </p>
        )}
        {MAIN_NAV.map(renderNavItem)}

        {/* Administration section — Editor only */}
        {user?.role === 'EDITOR' && (
          <>
            <div className="my-3 border-t border-sidebarBorder" aria-hidden="true" />
            {!collapsed && (
              <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-sidebarGroup select-none">
                Administration
              </p>
            )}
            {ADMIN_NAV.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* User profile (bottom) */}
      <div className="border-t border-sidebarBorder p-3 flex-shrink-0">
        {collapsed ? (
          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center
                       text-xs font-bold text-onPrimary mx-auto"
            title={user?.name}
            aria-label={user?.name}
          >
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <div
              className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center
                         justify-center text-xs font-bold text-onPrimary"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebarTextActive truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-xs text-sidebarText truncate leading-tight mt-0.5">
                {user?.role === 'EDITOR' ? 'Editor' : 'Viewer'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-surface border border-border
                   flex items-center justify-center shadow-elevation-1 z-50
                   hover:bg-muted transition-colors duration-150"
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={2.5} className="text-muted-foreground" />
        ) : (
          <ChevronLeft size={12} strokeWidth={2.5} className="text-muted-foreground" />
        )}
      </button>
    </aside>
  );
}
