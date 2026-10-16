import { useEffect, useState } from 'react';
import type { Project } from '../data/project';
import { fetchProjects } from '../data/projectSource';

export type ProjectsState =
  | { status: 'loading' }
  | { status: 'ready'; projects: Project[] }
  | { status: 'error'; message: string };

export function useProjects(): ProjectsState {
  const [state, setState] = useState<ProjectsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(controller.signal)
      .then((projects) => setState({ status: 'ready', projects }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Projects failed to load', error);
        setState({ status: 'error', message: 'Projects could not be loaded. Reload the page to try again.' });
      });
    return () => controller.abort();
  }, []);

  return state;
}
