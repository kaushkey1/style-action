import { Route } from 'react-router-dom';

import { LegacyRedirect } from './components/LegacyRedirect';
import DcOverviewPage from './pages/DcOverviewPage';
import EngineDashboardPage from './pages/EngineDashboardPage';
import WorkspacePage from './pages/WorkspacePage';

export const styleActionsProductRoutes = (
  <>
    <Route path="/style-actions-product" element={<WorkspacePage />} />
    <Route path="/style-actions-product/engine" element={<EngineDashboardPage />} />
    <Route path="/style-actions-product/dc/:dcCode" element={<DcOverviewPage />} />
    <Route path="/style-actions-product/health" element={<LegacyRedirect route="health" />} />
    <Route path="/style-actions-product/options" element={<LegacyRedirect route="options" />} />
    <Route path="/style-actions-product/options/:storeCode/:optionCode" element={<LegacyRedirect route="option" />} />
    <Route path="/style-actions-product/lifecycle" element={<LegacyRedirect route="lifecycle" />} />
  </>
);
