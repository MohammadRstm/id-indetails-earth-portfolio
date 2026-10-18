import { projectStatusLabel, projectTypeLabel, type Project } from '../data/project';
import { useCrossfade } from '../hooks/useCrossfade';
import { formatCoordinates } from '../lib/geo';
import { ArrowRightIcon } from './icons';

const FADE_MS = 220;

interface ProjectCaptionProps {
  projects: Project[];
  project: Project;
  onOpen: (projectId: string) => void;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The current project's name and place, shown beside the strip. */
export function ProjectCaption({ projects, project, onOpen }: ProjectCaptionProps) {
  const { shown, leaving } = useCrossfade(project, FADE_MS);
  const { location } = shown;

  return (
    <article className="caption" data-leaving={leaving} aria-labelledby="caption-title">
      <p className="caption__count">
        <span className="caption__number">{pad(projects.indexOf(shown) + 1)}</span>
        <span className="caption__total"> / {pad(projects.length)}</span>
      </p>
      <p className="caption__type">{projectTypeLabel[shown.type]}</p>
      <h2 className="caption__title" id="caption-title">
        {shown.title}
      </h2>
      <p className="caption__place">
        {location.city}, {location.country}
      </p>
      <p className="caption__coords">{formatCoordinates(location.lat, location.lng)}</p>
      <p className="caption__summary">{shown.description}</p>
      <p className="caption__meta">
        <span>{shown.year}</span>
        <span aria-hidden="true">·</span>
        <span>{projectStatusLabel[shown.status]}</span>
      </p>
      <button type="button" className="text-action caption__open" onClick={() => onOpen(shown.id)}>
        View project
        <ArrowRightIcon />
      </button>
    </article>
  );
}
