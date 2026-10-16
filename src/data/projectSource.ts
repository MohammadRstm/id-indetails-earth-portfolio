import { demoProjects } from './demoProjects';
import type { Project } from './project';

/**
 * Single entry point for project data. It resolves the local demonstration
 * set today; swapping the body for an API request keeps every caller as is.
 */
export async function fetchProjects(signal?: AbortSignal): Promise<Project[]> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return demoProjects;
}
