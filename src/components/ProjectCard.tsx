import type { MouseEvent } from 'react';
import { placeName, projectStatusLabel, type Project } from '../data/project';
import { pathFor } from '../hooks/useSiteRoute';
import { LoadedImage } from './LoadedImage';

/** A project in a grid: a real link to its page (so it can open in a new tab) that opens it in place on a plain click. */
export function ProjectCard({ project, onOpen }: { project: Project; onOpen: (slug: string) => void }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(project.slug);
  };

  return (
    <a className="project-card" href={pathFor({ page: 'project', slug: project.slug })} onClick={open}>
      <span className="project-card__image">
        <LoadedImage src={project.thumbnail} alt="" loading="lazy" decoding="async" />
      </span>
      <span className="project-card__meta">
        {project.typeLabel} · {project.year}
      </span>
      <span className="project-card__title">{project.title}</span>
      <span className="project-card__place">{placeName(project.location)}</span>
      <span className="project-card__status" data-status={project.status}>
        {projectStatusLabel[project.status]}
      </span>
    </a>
  );
}
