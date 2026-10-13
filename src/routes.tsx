import { Route } from 'react-router-dom';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { AdminSpacePlanningPage } from '@/pages/admin/AdminSpacePlanningPage';
import { AdminSpaceMastersPage } from '@/pages/admin/AdminSpaceMastersPage';
import { AdminFixturesPage } from '@/pages/admin/AdminFixturesPage';
import { dashboardRoutes } from '@/modules/dashboard/route';
import { exceptionRoutes } from '@/modules/exceptions/route';
import { reviewRoutes } from '@/modules/review/route';
import { agentRoutes } from '@/modules/agents/route';
import { calendarRoutes } from '@/modules/calendar/route';
import { inventoryRoutes } from '@/modules/inventory/route';
import { otbRoutes } from '@/modules/otb/route';
import { rangeRoutes } from '@/modules/range/route';
import { storeViewRoutes } from '@/modules/store-view/route';
import { store360Routes } from '@/modules/store-360/route';
import { styleBankRoutes } from '@/modules/style-bank/route';
import { aopRoutes } from '@/modules/aop/route';
import { aopPlanningRoutes } from '@/modules/aop-planning/route';
import { adminRoutes } from '@/modules/admin/route';
import { extensionRoutes } from '@/modules/extensions/route';
import { docsRoutes } from '@/modules/docs/route';
import { planogramRoutes } from '@/modules/planogram/route';
import { jarvisRoutes } from '@/modules/jarvis/route';
import { categoryDirectorRoutes } from '@/modules/category-director/route';
import { externalBrandsRoutes } from '@/modules/external-brands/route';
import { vendorCatalogRoutes } from '@/modules/vendor-catalog/route';
import { categoriesRoutes } from '@/modules/categories/route';
import { sourcingRoutes } from '@/modules/sourcing/route';
import { tasksRoutes } from '@/modules/tasks/route';
import { agenticBrainRoutes } from '@/modules/agentic-brain/route';
import { knowledgeBaseRoutes } from '@/modules/knowledge-base/route';
import { actionRegisterRoutes } from '@/modules/action-register/route';
import { specsRoutes } from '@/modules/specs/route';
import { productDisplayRoutes } from '@/modules/product-display/route';
import { spacePlanningRoutes } from '@/modules/space-planning/route';
import { designsRoutes } from '@/modules/designs/route';
import { styleActionsProductRoutes } from '@/modules/style-actions-product/route';

const placeholderRoutes = (
  <>
    <Route path="/nextwave" element={<PlaceholderPage />} />
    <Route path="/nextwave/*" element={<PlaceholderPage />} />
    <Route path="/costing-engine" element={<PlaceholderPage />} />
    <Route path="/costing-engine/*" element={<PlaceholderPage />} />
    <Route path="/procuro" element={<PlaceholderPage />} />
    <Route path="/procuro/*" element={<PlaceholderPage />} />
    <Route path="/uvp" element={<PlaceholderPage />} />
    <Route path="/uvp/*" element={<PlaceholderPage />} />
    <Route path="/intellimake" element={<PlaceholderPage />} />
    <Route path="/intellimake/*" element={<PlaceholderPage />} />
    <Route path="/intellipack" element={<PlaceholderPage />} />
    <Route path="/intellipack/*" element={<PlaceholderPage />} />
    <Route path="/intellistore" element={<PlaceholderPage />} />
    <Route path="/intellistore/*" element={<PlaceholderPage />} />
    <Route path="/pulsepoint" element={<PlaceholderPage />} />
    <Route path="/pulsepoint/*" element={<PlaceholderPage />} />
    <Route path="/digital-twin" element={<PlaceholderPage />} />
    <Route path="/digital-twin/*" element={<PlaceholderPage />} />
    <Route path="/intellitrim" element={<PlaceholderPage />} />
    <Route path="/intellitrim/*" element={<PlaceholderPage />} />
    <Route path="/intelliloom" element={<PlaceholderPage />} />
    <Route path="/intelliloom/*" element={<PlaceholderPage />} />
    <Route path="/intellimasters" element={<PlaceholderPage />} />
    <Route path="/intellimasters/*" element={<PlaceholderPage />} />
    <Route path="/recon" element={<PlaceholderPage />} />
    <Route path="/recon/*" element={<PlaceholderPage />} />
    <Route path="/analytics" element={<PlaceholderPage />} />
    <Route path="/analytics/*" element={<PlaceholderPage />} />
    <Route path="/execute/retail-calendar" element={<PlaceholderPage />} />
    <Route path="/execute/retail-calendar/*" element={<PlaceholderPage />} />
    <Route path="/execute/marketing-calendar" element={<PlaceholderPage />} />
    <Route path="/execute/marketing-calendar/*" element={<PlaceholderPage />} />
    <Route path="/execute/store-calendar" element={<PlaceholderPage />} />
    <Route path="/execute/store-calendar/*" element={<PlaceholderPage />} />
    <Route path="/execute/director-effectiveness" element={<PlaceholderPage />} />
    <Route path="/execute/director-effectiveness/*" element={<PlaceholderPage />} />
  </>
);

export const appRoutes = (
  <>
    {dashboardRoutes}
    {reviewRoutes}
    {exceptionRoutes}
    {agentRoutes}
    {calendarRoutes}
    {inventoryRoutes}
    {otbRoutes}
    {rangeRoutes}
    {planogramRoutes}
    {externalBrandsRoutes}
    {vendorCatalogRoutes}
    {storeViewRoutes}
    {store360Routes}
    {styleBankRoutes}
    {aopRoutes}
    {aopPlanningRoutes}
    {adminRoutes}
    {extensionRoutes}
    {docsRoutes}
    {jarvisRoutes}
    {categoryDirectorRoutes}
    {categoriesRoutes}
    {sourcingRoutes}
    {tasksRoutes}
    {agenticBrainRoutes}
    {knowledgeBaseRoutes}
    {actionRegisterRoutes}
    {specsRoutes}
    {productDisplayRoutes}
    {spacePlanningRoutes}
    {designsRoutes}
    {styleActionsProductRoutes}
    {placeholderRoutes}
    <Route path="/admin/space-planning" element={<AdminSpacePlanningPage />} />
    <Route path="/admin/space-masters" element={<AdminSpaceMastersPage />} />
    <Route path="/admin/fixtures" element={<AdminFixturesPage />} />
  </>
);
