import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, LogOut, User, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

const ROUTE_LABELS: Record<string, string> = {
  '/inventory':      'Inventory Dashboard',
  '/products':       'Products',
  '/movements':      'Stock Movements',
  '/suppliers':      'Suppliers',
  '/audit-log':      'Audit Log',
  '/reference-data': 'Reference Data',
};

interface HeaderProps {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export function Header({
  sidebarCollapsed,
  mobileMenuOpen,
  onMobileMenuToggle,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle = ROUTE_LABELS[location.pathname] ?? 'StockLedger';

  const initials = user?.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() ?? '?';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header
      className="sticky top-0 z-30 h-14 bg-headerBg border-b border-headerBorder
                 flex items-center px-4 md:px-6 gap-4"
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMobileMenuToggle}
        aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileMenuOpen}
        className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center
                   rounded-lg hover:bg-muted transition-colors text-muted-foreground"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      {/* Mobile brand (visible when sidebar hidden) */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
          <BarChart3 size={13} color="white" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm text-onBackground">StockLedger</span>
      </div>

      {/* Page title */}
      <h1 className="hidden md:block text-base font-semibold text-onBackground">
        {pageTitle}
      </h1>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {/* Role badge */}
        <span
          className={cn(
            'hidden sm:inline-flex badge text-xs',
            user?.role === 'EDITOR' ? 'badge-editor' : 'badge-viewer',
          )}
        >
          {user?.role === 'EDITOR' ? 'Editor' : 'Viewer'}
        </span>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            aria-label="Open user menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted
                       transition-colors duration-150 group"
          >
            <div
              className="w-7 h-7 rounded-full bg-primary flex items-center justify-center
                         text-xs font-bold text-onPrimary flex-shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-onBackground max-w-[120px] truncate">
              {user?.name}
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={cn(
                'hidden sm:block text-muted-foreground transition-transform duration-150',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {/* Dropdown panel */}
          {dropdownOpen && (
            <div
              role="menu"
              aria-label="User options"
              className="absolute right-0 mt-1 w-56 bg-surface rounded-lg shadow-elevation-3
                         border border-border py-1 animate-scale-in origin-top-right"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-onSurface truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                <span
                  className={cn(
                    'mt-2 inline-flex badge text-xs',
                    user?.role === 'EDITOR' ? 'badge-editor' : 'badge-viewer',
                  )}
                >
                  {user?.role === 'EDITOR' ? 'Editor' : 'Viewer'}
                </span>
              </div>

              {/* Actions */}
              <div className="py-1">
                <button
                  role="menuitem"
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground
                             hover:bg-muted transition-colors text-left opacity-60 cursor-not-allowed"
                >
                  <User size={15} strokeWidth={2} aria-hidden="true" />
                  Profile settings
                </button>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error
                             hover:bg-errorBackground transition-colors text-left"
                >
                  <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
