import { useEffect, useRef } from 'react';
import type { Project } from '../data/project';
import { formatCoordinates } from '../lib/geo';
import { CloseIcon } from './icons';
import { ProjectFacts } from './ProjectFacts';

interface ProjectDetailDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

/** Native modal dialog: focus is trapped and returned by the browser, Escape closes it. */
export function ProjectDetailDialog({ project, open, onClose }: ProjectDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const { location, details } = project;

  return (
    <dialog
      ref={dialogRef}
      className="details"
      aria-labelledby="details-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="details__inner">
        <div className="details__head">
          <div>
            <p className="details__place">
              {location.city}, {location.country}
              <span className="details__coords">{formatCoordinates(location.lat, location.lng)}</span>
            </p>
            <h2 className="details__title" id="details-title">
              {project.title}
            </h2>
          </div>
          <button type="button" className="icon-button details__close" aria-label="Close project details" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ProjectFacts project={project} className="details__facts" />

        {project.image && (
          <img className="details__image" src={project.image.src} alt={project.image.alt} width={1200} height={675} />
        )}

        <p className="details__lead">{project.description}</p>
        {details && (
          <>
            <p className="details__overview">{details.overview}</p>
            <div className="details__columns">
              <section aria-labelledby="details-scope">
                <h3 id="details-scope">Scope</h3>
                <ul>
                  {details.scope.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section aria-labelledby="details-stack">
                <h3 id="details-stack">Technology</h3>
                <ul>
                  {details.stack.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}

        <p className="details__note">This is a demonstration project. Its name, place and details are illustrative.</p>
      </div>
    </dialog>
  );
}
