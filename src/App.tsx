import { useEffect, useState } from 'react';
import { analyticsConfigured, chooseConsent, consentNeeded, pageView } from './analytics/analytics';
import { ConsentBanner } from './components/ConsentBanner';
import { ContactPage } from './components/ContactPage';
import { Explorer } from './components/Explorer';
import { PrivacyPage } from './components/PrivacyPage';
import { ProjectNotFound } from './components/ProjectNotFound';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { StudioPage } from './components/StudioPage';
import { UnderConstruction } from './components/UnderConstruction';
import { usePrefersReducedMotion } from './hooks/useMediaQuery';
import { useProjects } from './hooks/useProjects';
import { useSiteContent } from './hooks/useSiteContent';
import { GRID_ID, pathFor, savedScrollY, useSiteRoute, type Route } from './hooks/useSiteRoute';

const SITE_TITLE = 'ID-Indetails';

export default function App() {
  const projects = useProjects();
  const content = useSiteContent();
  const reducedMotion = usePrefersReducedMotion();
  const list = projects.status === 'ready' ? projects.projects : null;
  const { route, openProject, closeProject, goTo, showGrid } = useSiteRoute();
  const path = pathFor(route);
  const [askingConsent, setAskingConsent] = useState(consentNeeded);
  const askConsent = analyticsConfigured ? () => setAskingConsent(true) : undefined;
  // Under construction, only Contact and Privacy stay open; every other address shows the construction page.
  // Until the settings answer, those other pages wait, so they never flash before the construction page.
  const alwaysOpen = route.page === 'contact' || route.page === 'privacy';
  const underConstruction = content.settings.underConstruction;
  const closed = !alwaysOpen && (underConstruction || !content.loaded);
  // While projects load, a project address is taken on trust so a shared link is not lost.
  const projectMissing = route.page === 'project' && list !== null && !list.some((project) => project.slug === route.slug);
  const openSlug = route.page === 'project' && !projectMissing ? route.slug : null;
  const onGlobe = !closed && (route.page === 'home' || openSlug !== null);

  // The grid is there to scroll to once the projects have loaded.
  const toGrid = route.page === 'home' && route.grid === true && list !== null;
  useScrollForRoute(path, openSlug !== null, toGrid, reducedMotion);

  useEffect(() => {
    const project = openSlug ? list?.find((item) => item.slug === openSlug) : undefined;
    const titles: Record<Route['page'], string> = {
      home: `${SITE_TITLE} · Architecture`,
      project: project ? `${project.title} · ${SITE_TITLE}` : projectMissing ? `Project not found · ${SITE_TITLE}` : SITE_TITLE,
      studio: `Studio · ${SITE_TITLE}`,
      contact: `Contact · ${SITE_TITLE}`,
      privacy: `Privacy · ${SITE_TITLE}`,
    };
    if (closed && !content.loaded) return;
    document.title = closed ? `Under construction · ${SITE_TITLE}` : titles[route.page];
    // Counted once the title is the page's own: a project's waits for the projects to load.
    if (route.page !== 'project' || list !== null) pageView(path, document.title);
  }, [route.page, path, openSlug, list, projectMissing, closed, content.loaded]);

  // The favicon chosen in the dashboard, once there is one; until then the site's own.
  const { faviconUrl } = content.settings;
  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon || !faviconUrl) return;
    icon.removeAttribute('type');
    icon.href = faviconUrl;
  }, [faviconUrl]);

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <SiteHeader current={route.page === 'project' ? 'home' : route.page} onNavigate={goTo} logoOnly={underConstruction} />

      {closed && (content.loaded ? <UnderConstruction onNavigate={goTo} /> : <main className="page" id="content" aria-busy="true" />)}
      {!closed && list && list.length > 0 ? (
        // Stays mounted behind the other pages, so the globe and the strip are ready the moment you come back.
        <Explorer
          projects={list}
          offices={content.offices}
          openSlug={openSlug}
          active={onGlobe}
          onOpenProject={openProject}
          onCloseProject={closeProject}
          onContact={() => goTo('contact')}
        />
      ) : (
        onGlobe && (
          <main className="explorer explorer--empty" id="content">
            <h1 className="visually-hidden">ID-Indetails architecture projects</h1>
            <p className="explorer__message" role="status">
              {projects.status === 'error'
                ? projects.message
                : projects.status === 'loading'
                  ? 'Loading projects'
                  : 'There are no projects to show yet.'}
            </p>
          </main>
        )
      )}
      {!closed && projectMissing && <ProjectNotFound onShowProjects={showGrid} />}
      {!closed && route.page === 'studio' && <StudioPage services={content.services} offices={content.offices} onContact={() => goTo('contact')} />}
      {route.page === 'contact' && <ContactPage offices={content.offices} contact={content.contact} />}
      {route.page === 'privacy' && <PrivacyPage onCookieSettings={askConsent} />}

      <SiteFooter socialLinks={content.socialLinks} onNavigate={goTo} onCookieSettings={askConsent} underConstruction={underConstruction} />
      {askingConsent && (
        <ConsentBanner
          onNavigate={goTo}
          onAnswer={(choice) => {
            chooseConsent(choice);
            setAskingConsent(false);
          }}
        />
      )}
    </>
  );
}

/**
 * Each view starts at the top, and a project always does, so its photograph
 * and globe show right under the header; the exceptions are the home page's
 * grid when asked for (an old projects link, or the link on the "Project not
 * found" page) and a page reached with Back, which returns to where it was
 * left (such as further down the grid). From far down a long page a smooth
 * scroll would only sweep past empty space, so it jumps instead.
 */
function useScrollForRoute(path: string, isProject: boolean, toGrid: boolean, reducedMotion: boolean) {
  useEffect(() => {
    const grid = toGrid ? document.getElementById(GRID_ID) : null;
    const top = isProject
      ? 0
      : grid
        ? grid.getBoundingClientRect().top + window.scrollY
        : (savedScrollY(window.history.state) ?? 0);
    const near = Math.abs(window.scrollY - top) < window.innerHeight * 1.5;
    window.scrollTo({ top, behavior: near && !reducedMotion ? 'smooth' : 'auto' });
  }, [path, isProject, toGrid, reducedMotion]);
}
