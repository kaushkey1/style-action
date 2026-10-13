import { Route } from 'react-router-dom';
import { CategoriesListPage } from './pages/CategoriesListPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';

export const categoriesRoutes = (
  <>
    <Route path="/categories" element={<CategoriesListPage />} />
    <Route path="/categories/:categoryName" element={<CategoryDetailPage />} />
  </>
);
