import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { WasteManagement } from './pages/admin/WasteManagement';
import { ShipmentsManagement } from './pages/admin/ShipmentsManagement';
import { ShipmentDetailPage } from './pages/admin/ShipmentDetailPage';
import { InvestigationsPage } from './pages/admin/InvestigationsPage';
import { InvestigationDetailPage } from './pages/admin/InvestigationDetailPage';
import { IncidentsPage } from './pages/admin/IncidentsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { ComplianceDashboard } from './pages/admin/ComplianceDashboard';
import { LabDashboard } from './pages/laboratory/LabDashboard';
import { TransporterDashboard } from './pages/transporter/TransporterDashboard';
import { FacilityDashboard } from './pages/facility/FacilityDashboard';
import { HazTrackAIAssistant } from './components/common/HazTrackAIAssistant';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { RoleGuard } from './components/layout/RoleGuard';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuth } from './context/AuthContext';

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user || user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'LABORATORY' || user.role === 'INDUSTRY') return <Navigate to="/lab/dashboard" replace />;
  if (user.role === 'TRANSPORTER') return <Navigate to="/transporter/dashboard" replace />;
  if (user.role === 'TREATMENT_FACILITY') return <Navigate to="/facility/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Authentication */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Admin Dashboard & Controls */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Global Protected Routes with DashboardLayout */}
        <Route
          path="/admin/waste"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WasteManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/shipments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ShipmentsManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/shipments/:shipmentId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ShipmentDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/investigations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvestigationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/investigations/:investigationId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <InvestigationDetailPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/incidents"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <IncidentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ReportsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <AuditLogsPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <UsersPage />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Laboratory / Industry Portal */}
        <Route
          path="/lab/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['LABORATORY', 'INDUSTRY', 'ADMIN']}>
                <DashboardLayout>
                  <LabDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/lab/*" element={<Navigate to="/lab/dashboard" replace />} />

        {/* Transporter Portal */}
        <Route
          path="/transporter/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['TRANSPORTER', 'ADMIN']}>
                <DashboardLayout>
                  <TransporterDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/transporter/*" element={<Navigate to="/transporter/dashboard" replace />} />

        {/* Treatment Facility Portal */}
        <Route
          path="/facility/dashboard"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['TREATMENT_FACILITY', 'ADMIN']}>
                <DashboardLayout>
                  <FacilityDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />
        <Route path="/facility/*" element={<Navigate to="/facility/dashboard" replace />} />

        <Route
          path="/admin/compliance"
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['ADMIN']}>
                <DashboardLayout>
                  <ComplianceDashboard />
                </DashboardLayout>
              </RoleGuard>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <HazTrackAIAssistant />
    </BrowserRouter>
  );
};
export default App;
