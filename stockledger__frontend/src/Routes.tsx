import React from 'react';
import {
  BrowserRouter,
  Routes as RouterRoutes,
  Route,
  Navigate,
} from 'react-router-dom';
import ScrollToTop from 'components/ScrollToTop';
import ErrorBoundary from 'components/ErrorBoundary';
import { ProtectedRoute } from 'components/ProtectedRoute';
import { AppLayout } from 'components/layout/AppLayout';
import { Login } from 'pages/Login';
import { InventoryDashboard } from 'pages/InventoryDashboard';
import { ItemDetail } from 'pages/ItemDetail';
import { ReferenceData } from 'pages/settings/ReferenceData';
import { AuditLog } from 'pages/AuditLog';
import NotFound from 'pages/NotFound';

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated routes — guarded by ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Inventory dashboard is the landing screen after login */}
              <Route path="/inventory" element={<InventoryDashboard />} />
              {/* Item detail — must come after /inventory for correct route matching */}
              <Route path="/inventory/:id" element={<ItemDetail />} />

              {/* Audit Log — Editor-only screen */}
              <Route path="/audit-log" element={<AuditLog />} />

              <Route path="/settings/reference-data" element={<ReferenceData />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/inventory" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
