import { Route } from 'react-router-dom';
import { SpecsListPage } from './pages/SpecsListPage';

export const specsRoutes = (
  <>
    <Route path="/agents-brain/specs" element={<SpecsListPage />} />
  </>
);
