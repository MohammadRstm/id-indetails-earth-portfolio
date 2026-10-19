import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { Project } from '../data/project';
import { GRID_ID } from '../hooks/useSiteRoute';
import { clampPage, pageCount, pageFromQuery, pageItems, pageLinks, pageToQuery } from '../lib/pagination';
import { filterOptions, filterProjects, filtersFromQuery, filtersToQuery, noFilters, sortProjects, type ProjectFilters } from '../lib/projectFilters';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { ProjectCard } from './ProjectCard';
import { ProjectFilterBar } from './ProjectFilterBar';

interface HomeProjectsProps {
  /** Every project, not just the strip's. */
  projects: Project[];
  reducedMotion: boolean;
  onOpenProject: (slug: string) => void;
}

const queryFor = (filters: ProjectFilters, page: number) => [filtersToQuery(filters), pageToQuery(page)].filter(Boolean).join('&');

/**
 * Every project under the globe, with the search, filters and sort, a page
 * at a time. The filters and the page live in the address
 * (`/?type=villa&page=2`), so a filtered list can be shared and is still
 * there after opening a project and coming back.
 */
export function HomeProjects({ projects, reducedMotion, onOpenProject }: HomeProjectsProps) {
  const [filters, setFilters] = useState<ProjectFilters>(() => filtersFromQuery(window.location.search));
  const [requested, setRequested] = useState(() => pageFromQuery(window.location.search));
  const options = useMemo(() => filterOptions(projects), [projects]);
  const shown = useMemo(() => sortProjects(filterProjects(projects, filters), filters.sort), [projects, filters]);
  const count = pageCount(shown.length);
  const page = clampPage(requested, count);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const query = queryFor(filters, page);
    const address = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (address !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', address);
  }, [filters, page]);

  // A change of filter starts again from the first page.
  const update = (changes: Partial<ProjectFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setRequested(1);
  };
  const clear = () => update({ ...noFilters, sort: filters.sort });

  const show = (event: MouseEvent<HTMLAnchorElement>, next: number) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setRequested(next);
    titleRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const hrefFor = (target: number) => {
    const query = queryFor(filters, target);
    return query ? `/?${query}` : '/';
  };

  const total = shown.length === projects.length ? `${projects.length} projects` : `${shown.length} of ${projects.length} projects`;

  return (
    <section className="home-projects" id={GRID_ID} aria-labelledby="home-projects-title">
      <h2 className="section-title home-projects__title" id="home-projects-title" ref={titleRef}>
        All projects
      </h2>

      <ProjectFilterBar filters={filters} options={options} onChange={update} onClear={clear} />

      <p className="filters__count" role="status">
        {count > 1 ? `${total} · page ${page} of ${count}` : total}
      </p>

      {shown.length > 0 ? (
        <ul className="project-grid">
          {pageItems(shown, page).map((project) => (
            <li key={project.slug}>
              <ProjectCard project={project} onOpen={onOpenProject} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="project-grid__empty">
          <p>No projects match these filters.</p>
          <button type="button" className="text-action" onClick={clear}>
            Clear filters
          </button>
        </div>
      )}

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
