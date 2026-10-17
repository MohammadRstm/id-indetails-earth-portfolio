import { useCallback, useEffect, useState } from 'react';

const PROJECT_PATH = /^\/projects\/([^/]+)\/?$/;
const HOME_PATH = '/';

/** Marks history entries this page pushed, so closing a project can step back instead of piling up entries. */
interface RouteState {
  pushed: true;
}

export function projectIdFromPath(pathname: string): string | null {
  const match = PROJECT_PATH.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`;

const wasPushed = (state: unknown) => typeof state === 'object' && state !== null && (state as Partial<RouteState>).pushed === true;

/**
 * The open project lives in the address bar (`/projects/<id>`) without ever
 * reloading the page: opening and closing use the History API, and the
 * browser's back and forward buttons move between the same views.
 */
export function useProjectRoute(isKnown: (id: string) => boolean) {
  const [openId, setOpenId] = useState(() => projectIdFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setOpenId(projectIdFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // An address for a project that does not exist falls back to the globe.
  const validId = openId !== null && isKnown(openId) ? openId : null;
  useEffect(() => {
    if (openId !== null && validId === null) window.history.replaceState(null, '', HOME_PATH);
  }, [openId, validId]);

  const open = useCallback((id: string) => {
    const current = projectIdFromPath(window.location.pathname);
    if (current === id) return;
    const state: RouteState = { pushed: true };
    // Moving between projects replaces the entry, so Back always returns to the globe.
    if (current === null) window.history.pushState(state, '', projectPath(id));
    else window.history.replaceState(window.history.state, '', projectPath(id));
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    if (projectIdFromPath(window.location.pathname) === null) return;
    if (wasPushed(window.history.state)) {
      window.history.back();
    } else {
      // Arrived straight on a project address: there is no globe entry to go back to.
      window.history.replaceState(null, '', HOME_PATH);
      setOpenId(null);
    }
  }, []);

  return { openId: validId, open, close };
}
