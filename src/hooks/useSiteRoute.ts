import { useCallback, useEffect, useState } from 'react';

export type Page = 'home' | 'projects' | 'studio' | 'contact';

export type Route = { page: Page } | { page: 'project'; slug: string };

const HOME: Route = { page: 'home' };
const PROJECT_PATH = /^\/projects\/([^/]+)\/?$/;
const PAGE_PATHS: Record<Page, string> = { home: '/', projects: '/projects', studio: '/studio', contact: '/contact' };

interface RouteState {
  /** On entries this page pushed for a project, so closing it can step back instead of piling up entries. */
  pushed?: true;
  /** How far down the page was scrolled when it was left, so coming back to it with Back returns there. */
  scrollY?: number;
}

/** Reads a route from an address. Anything unrecognised is the home page. */
export function routeFromPath(pathname: string): Route {
  const project = PROJECT_PATH.exec(pathname);
  if (project) {
    try {
      return { page: 'project', slug: decodeURIComponent(project[1]) };
    } catch {
      return HOME;
    }
  }
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const page = (Object.keys(PAGE_PATHS) as Page[]).find((candidate) => PAGE_PATHS[candidate] === trimmed);
  return page ? { page } : HOME;
}

export function pathFor(route: Route): string {
  return route.page === 'project' ? `/projects/${encodeURIComponent(route.slug)}` : PAGE_PATHS[route.page];
}

const wasPushed = (state: unknown) => typeof state === 'object' && state !== null && (state as RouteState).pushed === true;

/** Where the page was left, if it was left by moving to another page. */
export function savedScrollY(state: unknown): number | null {
  const scrollY = typeof state === 'object' && state !== null ? (state as RouteState).scrollY : undefined;
  return typeof scrollY === 'number' && Number.isFinite(scrollY) ? scrollY : null;
}

const rememberScroll = () => window.history.replaceState({ ...window.history.state, scrollY: window.scrollY } satisfies RouteState, '');

/**
 * The page and the open project live in the address bar (`/`, `/projects`,
 * `/projects/<slug>`, `/studio`, `/contact`) without the page ever
 * reloading: moving between them uses the History API, and the browser's
 * back and forward buttons move between the same views.
 */
export function useSiteRoute() {
  const [route, setRoute] = useState(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // An unknown address falls back to the globe. A project address is kept even when no project has
  // that slug, so the page can say the project was not found.
  const path = pathFor(route);
  useEffect(() => {
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
  }, [path]);

  const openProject = useCallback((slug: string) => {
    const current = routeFromPath(window.location.pathname);
    if (current.page === 'project' && current.slug === slug) return;
    const next: Route = { page: 'project', slug };
    // Moving between projects replaces the entry, so Back always returns to where the first one was opened from.
    if (current.page === 'project') {
      window.history.replaceState(window.history.state, '', pathFor(next));
    } else {
      rememberScroll();
      window.history.pushState({ pushed: true } satisfies RouteState, '', pathFor(next));
    }
    setRoute(next);
  }, []);

  /** Back to wherever the project was opened from: the globe or the projects page. */
  const closeProject = useCallback(() => {
    if (routeFromPath(window.location.pathname).page !== 'project') return;
    if (wasPushed(window.history.state)) {
      window.history.back();
    } else {
      // Arrived straight on a project address: there is no earlier entry to go back to.
      window.history.replaceState(null, '', PAGE_PATHS.home);
      setRoute(HOME);
    }
  }, []);

  const goTo = useCallback((page: Page) => {
    if (routeFromPath(window.location.pathname).page === page) return;
    rememberScroll();
    window.history.pushState(null, '', PAGE_PATHS[page]);
    setRoute({ page });
  }, []);

  return { route, openProject, closeProject, goTo };
}
