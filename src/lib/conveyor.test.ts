import { describe, expect, it } from 'vitest';
import { demoProjects } from '../data/demoProjects';
import { CONVEYOR_LIMIT, type Project } from '../data/project';
import { conveyorProjects } from './conveyor';

const many = (count: number, marked: (index: number) => boolean): Project[] =>
  Array.from({ length: count }, (_, index) => ({
    ...demoProjects[0],
    id: index + 1,
    slug: `project-${index + 1}`,
    showInConveyor: marked(index),
    conveyorOrder: marked(index) ? count - index : null,
  }));

const slugs = (projects: Project[]) => projects.map((project) => project.slug);

describe('conveyorProjects', () => {
  it('keeps only the marked projects, in their set order', () => {
    const projects = many(6, (index) => index % 2 === 0);
    expect(slugs(conveyorProjects(projects))).toEqual(['project-5', 'project-3', 'project-1']);
  });

  it('never shows more than the limit', () => {
    expect(conveyorProjects(many(100, () => true))).toHaveLength(CONVEYOR_LIMIT);
  });

  it('puts marked projects without an order last', () => {
    const projects = many(3, () => true).map((project, index) => (index === 2 ? project : { ...project, conveyorOrder: null }));
    expect(slugs(conveyorProjects(projects))[0]).toBe('project-3');
  });

  it('falls back to the first projects when none are marked, so the strip is never empty', () => {
    expect(slugs(conveyorProjects(many(30, () => false)))).toEqual(slugs(many(30, () => false).slice(0, CONVEYOR_LIMIT)));
  });
});
