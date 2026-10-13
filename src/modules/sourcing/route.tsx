import { Navigate, Route } from 'react-router-dom';

export const sourcingRoutes = (
  /* Sourcing dashboard now renders at /dashboard via DashboardRouter
     (role-aware). Keep this legacy URL as a redirect so bookmarks continue
     to work. */
  <Route path="/sourcing" element={<Navigate to="/dashboard" replace />} />
);
