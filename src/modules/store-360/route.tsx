import { Route } from 'react-router-dom';
import { Store360Page } from './pages/Store360Page';

export const store360Routes = (
  <>
    <Route path="/store-360/:storeId" element={<Store360Page />} />
    <Route path="/store-360" element={<Store360Page />} />
  </>
);
