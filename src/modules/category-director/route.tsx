import { Navigate, Route } from 'react-router-dom';
import { SubcategoryDrilldownPage } from './pages/SubcategoryDrilldownPage';

export const categoryDirectorRoutes = (
  <>
    {/* Category Director dashboard now renders at /dashboard via DashboardRouter
        (role-aware). Keep this legacy URL as a redirect so bookmarks and any
        externally-shared /category-director links continue to work. */}
    <Route path="/category-director" element={<Navigate to="/dashboard" replace />} />
    {/* Subcategory drilldown lives under /dashboard now. */}
    <Route path="/dashboard/subcategory/:categoryName" element={<SubcategoryDrilldownPage />} />
  </>
);
