import { Route } from 'react-router-dom';
import PlanogramDashboardPage from './pages/PlanogramDashboardPage';

export const planogramRoutes = (
  <>
    <Route path="/planogram" element={<PlanogramDashboardPage />} />
  </>
);