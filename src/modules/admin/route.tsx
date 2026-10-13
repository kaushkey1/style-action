import { Route } from 'react-router-dom';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrganizationPage } from './pages/AdminOrganizationPage';
import { AdminRolesPage } from './pages/AdminRolesPage';
import { AdminGroupsPage } from './pages/AdminGroupsPage';
import { AdminKPIsPage } from './pages/AdminKPIsPage';
import { AdminExceptionsPage } from './pages/AdminExceptionsPage';
import { AdminMobilePage } from './pages/AdminMobilePage';
import { AdminNotificationsPage } from './pages/AdminNotificationsPage';
import { AdminAuditLogPage } from './pages/AdminAuditLogPage';
import { AdminTransitionsPage } from './pages/AdminTransitionsPage';
import { AdminLifecyclePage } from './pages/AdminLifecyclePage';
import { AdminFixturesPage } from './pages/AdminFixturesPage';
import { AdminStoreGradesPage } from './pages/AdminStoreGradesPage';
import { AdminSpacePlanningPage } from './pages/AdminSpacePlanningPage';
import { AdminAnrConfigPage } from '@/modules/anr/pages/AdminAnrConfigPage';
import { AdminCalendarConfigPage } from './pages/AdminCalendarConfigPage';
import { AdminShowroomPage } from './pages/AdminShowroomPage';
import { AdminOTBConfigPage } from './pages/AdminOTBConfigPage';
import { AdminVmiConfigPage } from './pages/AdminVmiConfigPage';
import { AdminInventoryConfigPage } from './pages/AdminInventoryConfigPage';
import { AdminRangeConfigPage } from './pages/AdminRangeConfigPage';
import { AdminAOPConfigPage } from './pages/AdminAOPConfigPage';
import { AdminCategoryTeamsPage } from './pages/AdminCategoryTeamsPage';
import { AdminGuardrailsPage } from './pages/AdminGuardrailsPage';
import { AdminBuyingAccessPage } from './pages/AdminBuyingAccessPage';
import { AdminExtensionsPage } from '@/modules/extensions/pages/AdminExtensionsPage';
import { AdminExtensionDetailPage } from '@/modules/extensions/pages/AdminExtensionDetailPage';

export const adminRoutes = (
  <>
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/admin/organization" element={<AdminOrganizationPage />} />
    <Route path="/admin/roles" element={<AdminRolesPage />} />
    <Route path="/admin/groups" element={<AdminGroupsPage />} />
    <Route path="/admin/kpis" element={<AdminKPIsPage />} />
    <Route path="/admin/exceptions" element={<AdminExceptionsPage />} />
    <Route path="/admin/mobile" element={<AdminMobilePage />} />
    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
    <Route path="/admin/audit-log" element={<AdminAuditLogPage />} />
    <Route path="/admin/transitions" element={<AdminTransitionsPage />} />
    <Route path="/admin/lifecycle" element={<AdminLifecyclePage />} />
    <Route path="/admin/fixtures" element={<AdminFixturesPage />} />
    <Route path="/admin/store-grades" element={<AdminStoreGradesPage />} />
    <Route path="/admin/space-planning" element={<AdminSpacePlanningPage />} />
    <Route path="/admin/anr-config" element={<AdminAnrConfigPage />} />
    <Route path="/admin/calendar" element={<AdminCalendarConfigPage />} />
    <Route path="/admin/inventory" element={<AdminInventoryConfigPage />} />
    <Route path="/admin/showroom" element={<AdminShowroomPage />} />
    <Route path="/admin/otb-config" element={<AdminOTBConfigPage />} />
    <Route path="/admin/vmi-config" element={<AdminVmiConfigPage />} />
    <Route path="/admin/range-config" element={<AdminRangeConfigPage />} />
    <Route path="/admin/aop-config" element={<AdminAOPConfigPage />} />
    <Route path="/admin/category-teams" element={<AdminCategoryTeamsPage />} />
    <Route path="/admin/guardrails" element={<AdminGuardrailsPage />} />
    <Route path="/admin/buying-access" element={<AdminBuyingAccessPage />} />
    <Route path="/admin/extensions" element={<AdminExtensionsPage />} />
    <Route path="/admin/extensions/:extensionSlug" element={<AdminExtensionDetailPage />} />
  </>
);
