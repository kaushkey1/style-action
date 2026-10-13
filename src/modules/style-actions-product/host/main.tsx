import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@/index.css';

import { HostApp } from './HostApp';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <HostApp />
    </StrictMode>,
  );
}
