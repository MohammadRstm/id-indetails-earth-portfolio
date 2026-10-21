import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import { restoreConsent } from './analytics/analytics';
import { protectPhotos } from './lib/protectPhotos';
import './styles/global.css';
import App from './App';

// A visitor who accepted analytics before is counted from the first page, without being asked again.
restoreConsent();
protectPhotos();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
