import { Route, Navigate } from 'react-router-dom';
import { ReviewPage } from './pages/ReviewPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';

export const reviewRoutes = (
  <>
    <Route path="/review" element={<ReviewPage />} />
    <Route path="/review/:id" element={<ReviewDetailPage />} />
    <Route path="/exceptions" element={<Navigate to="/review?lifecycle=exception" replace />} />
    <Route path="/approvals" element={<Navigate to="/review?lifecycle=approval" replace />} />
  </>
);
