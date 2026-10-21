import { useEffect } from 'react';
import { ContactPage } from './components/ContactPage';
import { Explorer } from './components/Explorer';
import { ProjectNotFound } from './components/ProjectNotFound';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { StudioPage } from './components/StudioPage';
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
  // While projects load, a project address is taken on trust so a shared link is not lost.
  const projectMissing = route.page === 'project' && list !== null && !list.some((project) => project.slug === route.slug);
  const openSlug = route.page === 'project' && !projectMissing ? route.slug : null;
  const onGlobe = route.page === 'home' || openSlug !== null;

  // The grid is there to scroll to once the projects have loaded.
  const toGrid = route.page === 'home' && route.grid === true && list !== null;
  useScrollForRoute(pathFor(route), openSlug !== null, toGrid, reducedMotion);

  useEffect(() => {
    const project = openSlug ? list?.find((item) => item.slug === openSlug) : undefined;
    const titles: Record<Route['page'], string> = {
      home: `${SITE_TITLE} · Architecture`,
      project: project ? `${project.title} · ${SITE_TITLE}` : projectMissing ? `Project not found · ${SITE_TITLE}` : SITE_TITLE,
      studio: `Studio · ${SITE_TITLE}`,
      contact: `Contact · ${SITE_TITLE}`,
    };
    document.title = titles[route.page];
  }, [route.page, openSlug, list, projectMissing]);

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
      <SiteHeader current={route.page === 'project' ? 'home' : route.page} onNavigate={goTo} />

      {list && list.length > 0 ? (
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
      {projectMissing && <ProjectNotFound onShowProjects={showGrid} />}
      {route.page === 'studio' && <StudioPage services={content.services} offices={content.offices} onContact={() => goTo('contact')} />}
      {route.page === 'contact' && <ContactPage offices={content.offices} contact={content.contact} />}

      <SiteFooter socialLinks={content.socialLinks} onNavigate={goTo} />
    </>
  );
}

/**
 * Each view starts at the top, except a project, which starts just past the
 * header so the header scrolls out of sight and the whole photograph shows;
 * the home page's grid when asked for (an old projects link, or the link on
 * the "Project not found" page); and a page
 * reached with Back, which returns to where it was left (such as further
 * down the grid). From far down a long page a smooth scroll would only sweep
 * past empty space, so it jumps instead.
 */
function useScrollForRoute(path: string, isProject: boolean, toGrid: boolean, reducedMotion: boolean) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const grid = toGrid ? document.getElementById(GRID_ID) : null;
    const top = isProject
      ? (header?.offsetHeight ?? 0)
      : grid
        ? grid.getBoundingClientRect().top + window.scrollY
        : (savedScrollY(window.history.state) ?? 0);
    const near = Math.abs(window.scrollY - top) < window.innerHeight * 1.5;
    window.scrollTo({ top, behavior: near && !reducedMotion ? 'smooth' : 'auto' });
  }, [path, isProject, toGrid, reducedMotion]);
}
