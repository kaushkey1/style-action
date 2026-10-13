import { Route } from 'react-router-dom';
import OpenDesignApp from './OpenDesignApp';

export const designsRoutes = (
  <>
    <Route path="/designs/*" element={<OpenDesignApp />} />
  </>
);
