import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { UserRoleType } from '@/types/user';

// Routing components
import RoleBasedRedirect from './RoleBasedRedirect';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Dashboard from '@/pages/Dashboard';
import ProfilePage from '@/pages/profile/ProfilePage';
import Settings from '@/pages/settings/Settings';
import ErrorPage from '@/pages/ErrorPage';
import RedeemInvitationPages from '@/pages/redeem/RedeemCodePage';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/error/Unauthorized';

// Admin pages
import AdminPanel from '@/pages/admin/AdminPanel';

// Association pages
import AssociationProfile from '@/pages/association/AssociationProfile';
import AssociationMembers from '@/pages/association/AssociationMembers';
import AssociationDetails from '@/pages/association/AssociationDetails';
import AssociationsList from '@/pages/association/AssociationsList';

// Convention pages
import ConventionsList from '@/pages/conventions/ConventionsList';
import ConventionDetails from '@/pages/conventions/ConventionDetails';
import ConventionArchive from '@/pages/conventions/ConventionArchive';
import ConventionEquipment from '@/pages/conventions/ConventionEquipment';
import ConventionLocations from '@/pages/conventions/ConventionLocations';
import ConventionLogs from '@/pages/conventions/ConventionLogs';
import ConventionRequirements from '@/pages/conventions/ConventionRequirements';
import ConventionConsumables from '@/pages/conventions/ConventionConsumables';
import ConventionTemplates from '@/pages/conventions/ConventionTemplates';

// Inventory pages
import InventoryList from '@/pages/inventory/InventoryList';
import InventoryItems from '@/pages/inventory/InventoryItems';
import InventoryItemDetail from '@/pages/inventory/InventoryItemDetail';
import ItemCategories from '@/pages/inventory/ItemCategories';
import ItemLocations from '@/pages/inventory/ItemLocations';
import StorageLocations from '@/pages/inventory/StorageLocations';
import WarrantiesDocuments from '@/pages/inventory/WarrantiesDocuments';
import EquipmentSets from '@/pages/inventory/EquipmentSets';
import ImportExport from '@/pages/inventory/ImportExport';

// Reports
import ReportsList from '@/pages/reports/ReportsList';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';
import AssociationSetup from '@/pages/setup/AssociationSetup';

// Layouts
import RootLayout from '@/layouts/RootLayout';

// Define role permissions for different routes
const memberRoles: UserRoleType[] = ['member', 'manager', 'admin', 'system_admin', 'super_admin', 'guest'];
const managerRoles: UserRoleType[] = ['manager', 'admin', 'system_admin', 'super_admin'];
const adminRoles: UserRoleType[] = ['admin', 'system_admin', 'super_admin'];

/**
 * Główny komponent routingu aplikacji z inteligentnym przekierowaniem na podstawie ról
 */
export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public routes accessible without authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/setup" element={<AssociationSetup />} />

      {/* Protected routes wrapped by RootLayout */}
      <Route element={<RootLayout />}>
        {/* Główna trasa - inteligentne przekierowanie na podstawie roli */}
        <Route index element={<RoleBasedRedirect />} />

        {/* Dashboard - dostępny dla managerów i wyżej */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredRoles={managerRoles}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Profile - dostępny dla wszystkich zalogowanych */}
        <Route 
          path="profile" 
          element={
            <ProtectedRoute requiredRoles={memberRoles}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />

        {/* Redeem Code - dostępny dla wszystkich zalogowanych */}
        <Route 
          path="redeem-code" 
          element={
            <ProtectedRoute requiredRoles={memberRoles}>
              <RedeemInvitationPages />
            </ProtectedRoute>
          } 
        />

        {/* Settings - dostępny dla wszystkich zalogowanych */}
        <Route 
          path="settings" 
          element={
            <ProtectedRoute requiredRoles={memberRoles}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Admin Panel - tylko dla adminów */}
        <Route
          path="admin/*"
          element={
            <ProtectedRoute requiredRoles={adminRoles}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Association Management - dla managerów i wyżej */}
        <Route
          path="association/*"
          element={
            <ProtectedRoute requiredRoles={managerRoles}>
              <Routes>
                <Route index element={<AssociationsList />} />
                <Route path="profile" element={<AssociationProfile />} />
                <Route path="members" element={<AssociationMembers />} />
                <Route path="details/:id" element={<AssociationDetails />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Convention Management - dla członków i wyżej */}
        <Route
          path="conventions/*"
          element={
            <ProtectedRoute requiredRoles={memberRoles}>
              <Routes>
                <Route index element={<ConventionsList />} />
                <Route path=":id" element={<ConventionDetails />} />
                <Route path="archive" element={<ConventionArchive />} />
                <Route path=":id/equipment" element={<ConventionEquipment />} />
                <Route path=":id/locations" element={<ConventionLocations />} />
                <Route path=":id/logs" element={<ConventionLogs />} />
                <Route path=":id/requirements" element={<ConventionRequirements />} />
                <Route path=":id/consumables" element={<ConventionConsumables />} />
                <Route path="templates" element={<ConventionTemplates />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Inventory Management - dla członków i wyżej */}
        <Route
          path="inventory/*"
          element={
            <ProtectedRoute requiredRoles={memberRoles}>
              <Routes>
                <Route index element={<InventoryList />} />
                <Route path="items" element={<InventoryItems />} />
                <Route path="items/:itemId" element={<InventoryItemDetail />} />
                <Route path="categories" element={<ItemCategories />} />
                <Route path="locations" element={<ItemLocations />} />
                <Route path="storage" element={<StorageLocations />} />
                <Route path="warranties" element={<WarrantiesDocuments />} />
                <Route path="sets" element={<EquipmentSets />} />
                <Route path="import-export" element={<ImportExport />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Reports - dla managerów i wyżej */}
        <Route
          path="reports/*"
          element={
            <ProtectedRoute requiredRoles={managerRoles}>
              <ReportsList />
            </ProtectedRoute>
          }
        />

        {/* Catch-all for unmatched protected routes */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Catch-all for unmatched top-level routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
