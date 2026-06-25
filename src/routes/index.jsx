import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout     from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute     from './AdminRoute';
import LoginPage      from '../pages/Login';
import DashboardPage  from '../pages/Dashboard';
import VehicleListPage from '../pages/VehicleList';
import AdminUsersPage from '../pages/AdminUsers';
import NotFoundPage   from '../pages/NotFound';

import ProfilePage    from '../pages/Profile';
import TotalVehiclesPage from '../pages/TotalVehicles';
import TotalRevenuePage  from '../pages/TotalRevenue';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="vehicles"
          element={
            <ProtectedRoute>
              <VehicleListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="total-vehicles"
          element={
            <ProtectedRoute>
              <TotalVehiclesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="total-revenue"
          element={
            <ProtectedRoute>
              <TotalRevenuePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
