import { Route } from 'react-router-dom';
import { BrandListingPage } from './pages/BrandListingPage';
import { ExternalBrandsPage } from './pages/ExternalBrandsPage';

export const externalBrandsRoutes = (
  <>
    <Route path="/external-brands" element={<BrandListingPage />} />
    <Route path="/external-brands/:brandId/:segmentId/:familyId" element={<ExternalBrandsPage />} />
  </>
);