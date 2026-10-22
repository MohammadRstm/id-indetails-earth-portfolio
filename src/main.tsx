import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import { restoreConsent } from './analytics/analytics';
import { preloadGlobe } from './globe/preload';
import { routeFromPath } from './hooks/useSiteRoute';
import { protectPhotos } from './lib/protectPhotos';
import './styles/global.css';
import App from './App';

// A visitor who accepted analytics before is counted from the first page, without being asked again.
restoreConsent();
protectPhotos();
// A page that opens on the globe starts fetching it now, alongside the site's data.
if (['home', 'project'].includes(routeFromPath(window.location.pathname).page)) preloadGlobe();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
