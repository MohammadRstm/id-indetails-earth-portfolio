import { CONVEYOR_LIMIT, type Project } from '../data/project';

/**
 * The projects in the landing page's strip: those marked to show in it, in
 * their set order, at most CONVEYOR_LIMIT. If none are marked, the first
 * projects stand in, so the strip is never empty.
 */
export function conveyorProjects(projects: Project[]): Project[] {
  const marked = projects
    .filter((project) => project.showInConveyor)
    .sort((a, b) => (a.conveyorOrder ?? Infinity) - (b.conveyorOrder ?? Infinity));
  return (marked.length > 0 ? marked : projects).slice(0, CONVEYOR_LIMIT);
}
