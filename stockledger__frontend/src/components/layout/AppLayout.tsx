import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../utils/cn';

/**
 * AppLayout — authenticated shell used by every protected route.
 *
 * Structure:
 *   Fixed sidebar (240px expanded / 64px icon-only) +
 *   Flex column right area (sticky header + scrollable content)
 *
 * Sidebar collapse state lives here so the content margin can react to it.
 * Mobile: sidebar is a full-screen overlay triggered by the header hamburger.
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const contentMargin = sidebarCollapsed ? 'md:ml-16' : 'md:ml-60';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop + tablet sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-onBackground/40 z-30 md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Mobile sidebar (full-width variant) */}
          <div className="fixed top-0 left-0 h-screen z-40 w-60 md:hidden animate-slide-in-left">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main content column */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-[margin] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          contentMargin,
        )}
      >
        <Header
          sidebarCollapsed={sidebarCollapsed}
          mobileMenuOpen={mobileMenuOpen}
          onMobileMenuToggle={() => setMobileMenuOpen(o => !o)}
        />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-6"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
