import { Route } from 'react-router-dom';
import SpacePlanningDashboardPage from './pages/SpacePlanningDashboardPage';
import SpacePlanningStoreDetailPage from './pages/SpacePlanningStoreDetailPage';
import SpacePlanningDashboardPageOld from './pages/SpacePlanningDashboardPageOld';
import SpacePlanningStoreDetailPageOld from './pages/SpacePlanningStoreDetailPageOld';

export const spacePlanningRoutes = (
  <>
    <Route path="/space-planning" element={<SpacePlanningDashboardPage />} />
    {/* Static mock-based pages kept for A/B comparison against the API-wired UI */}
    <Route path="/space-planning/old" element={<SpacePlanningDashboardPageOld />} />
    <Route path="/space-planning/old/:code" element={<SpacePlanningStoreDetailPageOld />} />
    <Route path="/space-planning/:code" element={<SpacePlanningStoreDetailPage />} />
  </>
);
