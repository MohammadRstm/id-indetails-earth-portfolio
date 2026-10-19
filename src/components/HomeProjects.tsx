import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Project } from '../data/project';
import { clampPage, pageCount, pageFromQuery, pageItems, pageLinks, pageToQuery } from '../lib/pagination';
import { sortProjects } from '../lib/projectFilters';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { ProjectCard } from './ProjectCard';

interface HomeProjectsProps {
  /** Every project, not just the strip's. */
  projects: Project[];
  reducedMotion: boolean;
  onOpenProject: (slug: string) => void;
}

const hrefFor = (page: number) => {
  const query = pageToQuery(page);
  return query ? `/?${query}` : '/';
};

/**
 * Every project under the globe, newest first, a page at a time. The page
 * lives in the address (`/?page=2`), so Back from a project returns to it.
 */
export function HomeProjects({ projects, reducedMotion, onOpenProject }: HomeProjectsProps) {
  const sorted = useMemo(() => sortProjects(projects, 'newest'), [projects]);
  const count = pageCount(sorted.length);
  const [requested, setRequested] = useState(() => pageFromQuery(window.location.search));
  const page = clampPage(requested, count);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const query = pageToQuery(page);
    const address = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (address !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', address);
  }, [page]);

  const show = (event: MouseEvent<HTMLAnchorElement>, next: number) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setRequested(next);
    titleRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section className="home-projects" aria-labelledby="home-projects-title">
      <h2 className="section-title home-projects__title" id="home-projects-title" ref={titleRef}>
        All projects
      </h2>
      <p className="filters__count" role="status">
        {count > 1 ? `${sorted.length} projects · page ${page} of ${count}` : `${sorted.length} projects`}
      </p>

      <ul className="project-grid">
        {pageItems(sorted, page).map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} onOpen={onOpenProject} />
          </li>
        ))}
      </ul>

      {count > 1 && (
        <nav className="pager" aria-label="Project pages">
          {page > 1 ? (
            <a className="pager__step" href={hrefFor(page - 1)} onClick={(event) => show(event, page - 1)}>
              <ChevronLeftIcon />
              Previous
            </a>
          ) : (
            <span aria-hidden="true" />
          )}
          <ol className="pager__pages">
            {pageLinks(page, count).map((link, index) =>
              link === null ? (
                <li key={`gap-${index}`} className="pager__gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={link}>
                  <a
                    className="pager__page"
                    href={hrefFor(link)}
                    aria-label={`Page ${link}`}
                    aria-current={link === page ? 'page' : undefined}
                    onClick={(event) => show(event, link)}
                  >
                    {link}
                  </a>
                </li>
              ),
            )}
          </ol>
          {page < count ? (
            <a className="pager__step" href={hrefFor(page + 1)} onClick={(event) => show(event, page + 1)}>
              Next
              <ChevronRightIcon />
            </a>
          ) : (
            <span aria-hidden="true" />
          )}
        </nav>
      )}
    </section>
  );
}
