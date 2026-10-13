import { Route } from 'react-router-dom';
import { BrandListingPage } from './pages/BrandListingPage';
import { ExternalBrandsPage } from './pages/ExternalBrandsPage';

export const vendorCatalogRoutes = (
  <>
    <Route path="/vendor-catalog" element={<BrandListingPage />} />
    <Route path="/vendor-catalog/:brandId/:segmentId/:familyId" element={<ExternalBrandsPage />} />
  </>
);
