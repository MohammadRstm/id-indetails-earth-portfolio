import { projectStatusLabel, type Project } from '../data/project';
import { formatStartDate } from '../lib/format';

export function ProjectFacts({ project, className }: { project: Project; className?: string }) {
  const started = project.startDate ? formatStartDate(project.startDate) : null;
  return (
    <dl className={`facts ${className ?? ''}`}>
      <div className="facts__item">
        <dt>Status</dt>
        <dd>
          <span className="status" data-status={project.status}>
            <span className="status__dot" aria-hidden="true" />
            {projectStatusLabel[project.status]}
          </span>
        </dd>
      </div>
      <div className="facts__item">
        <dt>Category</dt>
        <dd>{project.category}</dd>
      </div>
      {started && (
        <div className="facts__item">
          <dt>Started</dt>
          <dd>{started}</dd>
        </div>
      )}
    </dl>
  );
}
