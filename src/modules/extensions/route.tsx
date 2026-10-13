import { Route } from 'react-router-dom';
import { ExtensionEmbedPage } from './pages/ExtensionEmbedPage';

export const extensionRoutes = (
  <>
    <Route path="/extensions/:extensionSlug/embed" element={<ExtensionEmbedPage />} />
  </>
);
