import { projectStatusLabel, projectTypeLabel, type Project, type ProjectImage } from '../data/project';
import { formatCoordinates } from '../lib/geo';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { ScrollLink } from './ScrollLink';

const areaFormat = new Intl.NumberFormat('en-GB');

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
}

function Photo({ image, className }: { image: ProjectImage; className: string }) {
  return (
    <figure className={className}>
      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
    </figure>
  );
}

/** Everything about one project, below the horizon of the zoomed-in globe. */
export function ProjectPage({ project, previous, next, onOpen }: ProjectPageProps) {
  const { location } = project;
  const photos = [project.hero, ...project.gallery];
  const credited = photos.filter((image) => image.credit);

  return (
    <article className="project-page" id="project-page" aria-labelledby="project-title" key={project.id}>
      <Photo image={project.hero} className="project-page__hero" />

      <div className="project-page__intro">
        <p className="project-page__lead">{project.summary}</p>
        <dl className="facts">
          <div>
            <dt>Location</dt>
            <dd>
              {location.city}, {location.country}
            </dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{projectTypeLabel[project.type]}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{projectStatusLabel[project.status]}</dd>
          </div>
          <div>
            <dt>{project.status === 'completed' ? 'Completed' : 'Expected'}</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>Floor area</dt>
            <dd>{areaFormat.format(project.areaSqm)} m²</dd>
          </div>
          <div className="facts__wide">
            <dt>Services</dt>
            <dd>{project.services.join(', ')}</dd>
          </div>
        </dl>
      </div>

      <section className="project-page__text" aria-labelledby="brief-title">
        <h3 id="brief-title">The brief</h3>
        <p>{project.brief}</p>
      </section>

      {project.gallery[0] && <Photo image={project.gallery[0]} className="project-page__photo project-page__photo--wide" />}

      <section className="project-page__text" aria-labelledby="concept-title">
        <h3 id="concept-title">Design concept</h3>
        <p>{project.concept}</p>
      </section>

      <div className="project-page__columns">
        <section aria-labelledby="materials-title">
          <h3 id="materials-title">Materials</h3>
          <ul>
            {project.materials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="sustainability-title">
          <h3 id="sustainability-title">Sustainability</h3>
          <ul>
            {project.sustainability.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {project.gallery.slice(1).map((image) => (
        <Photo key={image.src} image={image} className="project-page__photo" />
      ))}

      <section className="project-page__credits" aria-labelledby="credits-title">
        <h3 id="credits-title">Credits</h3>
        <dl>
          {project.team.map((member) => (
            <div key={member.role}>
              <dt>{member.role}</dt>
              <dd>{member.name}</dd>
            </div>
          ))}
        </dl>
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
      </section>

      <aside className="enquiry" aria-labelledby="enquiry-title">
        <h3 id="enquiry-title">Planning a {projectTypeLabel[project.type].toLowerCase()} of your own?</h3>
        <ScrollLink className="text-action" to="about">
          Start a conversation
          <ArrowRightIcon />
        </ScrollLink>
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
