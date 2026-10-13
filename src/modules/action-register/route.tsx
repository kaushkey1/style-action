import { Route } from 'react-router-dom';
import { ActionRegisterPage } from './pages/ActionRegisterPage';

export const actionRegisterRoutes = (
  <>
    <Route path="/agents-brain/action-register" element={<ActionRegisterPage />} />
  </>
);
