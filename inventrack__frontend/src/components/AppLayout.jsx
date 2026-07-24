import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['Viewer', 'Editor'],
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: Package,
    roles: ['Viewer', 'Editor'],
  },
  {
    label: 'Audit Log',
    path: '/audit-log',
    icon: ClipboardList,
    roles: ['Editor'],
  },
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    roles: ['Editor'],
  },
];

function Sidebar({ collapsed, onToggle, userRole }) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-surface border-r border-border h-screen sticky top-0 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn(
        'flex items-center h-16 border-b border-border px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <span className="text-lg font-semibold text-foreground tracking-tight">
            InvenTrack
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Main navigation">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Navigation
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileNav({ open, onClose, userRole }) {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 w-64 bg-surface shadow-elevation-3 animate-slide-in-left">
        <div className="flex items-center justify-between h-16 border-b border-border px-4">
          <span className="text-lg font-semibold text-foreground tracking-tight">
            InvenTrack
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="py-4 px-2 space-y-1" aria-label="Mobile navigation">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}

function Topbar({ onMenuOpen, user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6">
      <button
        onClick={onMenuOpen}
        className="md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="User menu"
          aria-expanded={dropdownOpen}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-foreground leading-tight">
              {user?.fullName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {user?.role || 'Role'}
            </p>
          </div>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-elevation-2 z-50 py-1 animate-scale-in">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-errorBackground transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userRole = user?.role || 'Viewer';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userRole}
      />

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuOpen={() => setMobileNavOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
