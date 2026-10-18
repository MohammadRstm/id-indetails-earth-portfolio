import { projectStatusLabel, projectTypeLabel, type Project, type ProjectImage } from '../data/project';
import { formatCoordinates } from '../lib/geo';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { ScrollLink } from './ScrollLink';

interface ProjectHeadingProps {
  project: Project;
  onBack: () => void;
}

/** The project's name, laid over the globe's close-up at the top of its page. */
export function ProjectHeading({ project, onBack }: ProjectHeadingProps) {
  const { location } = project;
  return (
    <div className="heading" key={project.id}>
      <button type="button" className="heading__back" onClick={onBack}>
        <ArrowLeftIcon />
        All projects
      </button>
      <div className="heading__body">
        <p className="heading__eyebrow">
          {projectTypeLabel[project.type]} · {location.city}, {location.country}
        </p>
        <h2 className="heading__title" id="project-title">
          {project.title}
        </h2>
        <p className="heading__coords">
          {formatCoordinates(location.lat, location.lng)} · {project.year}
        </p>
      </div>
      <ScrollLink className="heading__scroll" to="project-page">
        <ArrowDownIcon />
        <span>Project details</span>
      </ScrollLink>
    </div>
  );
}

interface ProjectPageProps {
  project: Project;
  previous: Project;
  next: Project;
  onOpen: (projectId: string) => void;
  onContact: () => void;
}

function Photo({ image, className }: { image: ProjectImage; className: string }) {
  return (
    <figure className={className}>
      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
    </figure>
  );
}

/** Everything about one project, below the horizon of the zoomed-in globe. */
export function ProjectPage({ project, previous, next, onOpen, onContact }: ProjectPageProps) {
  const { location } = project;
  const photos = [project.hero, ...project.gallery];
  const credited = photos.filter((image) => image.credit);

  return (
    <article className="project-page" id="project-page" aria-labelledby="project-title" key={project.id}>
      <Photo image={project.hero} className="project-page__hero" />

      <div className="project-page__intro">
        <p className="project-page__lead">{project.description}</p>
        <dl className="facts">
          <div>
            <dt>Status</dt>
            <dd>{projectStatusLabel[project.status]}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {location.city}, {location.country}
            </dd>
          </div>
          <div>
            <dt>{project.status === 'completed' ? 'Year' : 'Expected'}</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{projectTypeLabel[project.type]}</dd>
          </div>
        </dl>
      </div>

      {project.gallery.map((image) => (
        <Photo key={image.src} image={image} className="project-page__photo" />
      ))}

      <div className="project-page__credits">
        {credited.length > 0 && (
          <p className="project-page__photo-credits">
            Photography:{' '}
            {credited.map((image, index) => (
              <span key={image.src}>
                {index > 0 && ', '}
                <a href={image.credit?.url} target="_blank" rel="noopener noreferrer">
                  {image.credit?.photographer}
                </a>{' '}
                on {image.credit?.source}
              </span>
            ))}
            .
          </p>
        )}
        <p className="project-page__note">Illustrative project: the name, client and details are examples.</p>
      </div>

      <aside className="enquiry" aria-labelledby="enquiry-title">
        <h3 id="enquiry-title">Planning a {projectTypeLabel[project.type].toLowerCase()} of your own?</h3>
        <button type="button" className="text-action" onClick={onContact}>
          Contact us
          <ArrowRightIcon />
        </button>
      </aside>

      <nav className="project-nav" aria-label="More projects">
        {[
          { label: 'Previous project', item: previous },
          { label: 'Next project', item: next },
        ].map(({ label, item }) => (
          <button key={label} type="button" className="project-nav__link" onClick={() => onOpen(item.id)}>
            <img src={item.thumbnail} alt="" loading="lazy" decoding="async" />
            <span className="project-nav__label">{label}</span>
            <span className="project-nav__title">{item.title}</span>
            <span className="project-nav__place">
              {item.location.city}, {item.location.country}
            </span>
          </button>
        ))}
      </nav>
    </article>
  );
}
