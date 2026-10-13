import { Route, Navigate } from 'react-router-dom';
import InventoryCommandCenterPage from './pages/InventoryLifecyclePage';
import InventoryActionsPage from './pages/InventoryActionsPage';
import InventoryReplenishmentPage from './pages/InventoryReplenishmentPage';
import InventoryVmiPage from './pages/InventoryVmiPage';

export const inventoryRoutes = (
  <>
    <Route path="/inventory" element={<InventoryCommandCenterPage />} />
    <Route path="/inventory/actions" element={<InventoryActionsPage />} />
    <Route path="/inventory/replenishment" element={<InventoryReplenishmentPage />} />
    <Route path="/inventory/vmi" element={<InventoryVmiPage />} />
    <Route path="/execute/allocation" element={<Navigate to="/inventory/actions" replace />} />
    <Route path="/execute/allocation/actions" element={<Navigate to="/inventory/actions" replace />} />
  </>
);
