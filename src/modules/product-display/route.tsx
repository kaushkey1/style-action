import { Route } from 'react-router-dom';
import { ProductDisplayPage } from './pages/ProductDisplayPage';
import { ProductDetailPage } from './pages/ProductDetailPage';

export const productDisplayRoutes = (
  <>
    <Route path="/products/:storeId" element={<ProductDisplayPage />} />
    <Route path="/products/:storeId/:styleCode" element={<ProductDetailPage />} />
  </>
);
