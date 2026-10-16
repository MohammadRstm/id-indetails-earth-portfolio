import type { Project } from '../data/project';
import { useCrossfade } from '../hooks/useCrossfade';
import { formatCoordinates, type LocationGroup } from '../lib/geo';
import { LocalTime } from './LocalTime';
import { ProjectFacts } from './ProjectFacts';

interface ProjectPanelProps {
  project: Project;
  group: LocationGroup;
  onSelectProject: (projectId: string) => void;
  onOpenDetails: () => void;
}

const FADE_MS = 200;

export function ProjectPanel({ project, group, onSelectProject, onOpenDetails }: ProjectPanelProps) {
  const { shown, leaving } = useCrossfade(project, FADE_MS);
  const { location } = shown;
  const neighbours = group.projects.length > 1 && group.projects.includes(shown) ? group.projects : null;

  return (
    <article className="readout" data-leaving={leaving} aria-labelledby="project-title">
      <p className="readout__place">
        {location.city}, {location.country}
      </p>
      <p className="readout__coords">
        <span>{formatCoordinates(location.lat, location.lng)}</span>
        {location.timeZone && <LocalTime timeZone={location.timeZone} />}
      </p>

      <h2 className="readout__title" id="project-title">
        {shown.title}
      </h2>

      {neighbours && (
        <div className="readout__neighbours" role="group" aria-label={`Projects in ${location.city}`}>
          {neighbours.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={item.id === shown.id}
              onClick={() => onSelectProject(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <ProjectFacts project={shown} className="readout__facts" />

      <p className="readout__description">{shown.description}</p>

      {shown.image && (
        <figure className="readout__figure">
          <img src={shown.image.src} alt={shown.image.alt} width={1200} height={675} decoding="async" />
        </figure>
      )}

      {shown.details && (
        <button type="button" className="text-action" onClick={onOpenDetails}>
          View project details
        </button>
      )}
    </article>
  );
}
