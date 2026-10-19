import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { placeName, projectStatusLabel, projectTypeLabel, type Project } from '../data/project';
import { pathFor } from '../hooks/useSiteRoute';
import {
  filterOptions,
  filterProjects,
  filtersFromQuery,
  filtersToQuery,
  hasFilters,
  noFilters,
  sortProjects,
  type ProjectFilters,
  type ProjectSort,
} from '../lib/projectFilters';
import { LoadedImage } from './LoadedImage';

const SORT_LABELS: Record<ProjectSort, string> = { newest: 'Newest first', oldest: 'Oldest first', title: 'Title A to Z' };

interface ProjectsPageProps {
  projects: Project[];
  onOpenProject: (slug: string) => void;
}

/**
 * Every project as a grid, with filters. The filters live in the address
 * (`/projects?type=villa&year=2024`), so a filtered list can be shared and is
 * still there after visiting a project and coming back.
 */
export function ProjectsPage({ projects, onOpenProject }: ProjectsPageProps) {
  const [filters, setFilters] = useState<ProjectFilters>(() => filtersFromQuery(window.location.search));
  const options = useMemo(() => filterOptions(projects), [projects]);
  const shown = useMemo(() => sortProjects(filterProjects(projects, filters), filters.sort), [projects, filters]);

  useEffect(() => {
    const query = filtersToQuery(filters);
    const address = `${window.location.pathname}${query ? `?${query}` : ''}`;
    if (address !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', address);
  }, [filters]);

  const update = (changes: Partial<ProjectFilters>) => setFilters((current) => ({ ...current, ...changes }));

  const open = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpenProject(slug);
  };

  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Projects</p>
        <h1 className="page__title">Our work around the world.</h1>
      </header>

      <form className="filters" role="search" aria-label="Filter projects" onSubmit={(event) => event.preventDefault()}>
        <label className="filters__field filters__field--search">
          <span className="filters__label">Search</span>
          <input
            className="filters__input"
            type="search"
            placeholder="Name, client, city or country"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
          />
        </label>
        <label className="filters__field">
          <span className="filters__label">Type</span>
          <select
            className="filters__input"
            value={filters.type ?? ''}
            onChange={(event) => update({ type: (event.target.value || null) as ProjectFilters['type'] })}
          >
            <option value="">All types</option>
            {options.types.map((type) => (
              <option key={type} value={type}>
                {projectTypeLabel[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Status</span>
          <select
            className="filters__input"
            value={filters.status ?? ''}
            onChange={(event) => update({ status: (event.target.value || null) as ProjectFilters['status'] })}
          >
            <option value="">Any status</option>
            {options.statuses.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabel[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Year</span>
          <select
            className="filters__input"
            value={filters.year ?? ''}
            onChange={(event) => update({ year: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Any year</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Country</span>
          <select className="filters__input" value={filters.country ?? ''} onChange={(event) => update({ country: event.target.value || null })}>
            <option value="">All countries</option>
            {options.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Sort</span>
          <select className="filters__input" value={filters.sort} onChange={(event) => update({ sort: event.target.value as ProjectSort })}>
            {(Object.keys(SORT_LABELS) as ProjectSort[]).map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="filters__clear"
          disabled={!hasFilters(filters)}
          onClick={() => setFilters({ ...noFilters, sort: filters.sort })}
        >
          Clear filters
        </button>
      </form>

      <p className="filters__count" role="status">
        {shown.length === projects.length ? `${projects.length} projects` : `${shown.length} of ${projects.length} projects`}
      </p>

      {shown.length > 0 ? (
        <ul className="project-grid">
          {shown.map((project) => (
            <li key={project.slug}>
              <a className="project-card" href={pathFor({ page: 'project', slug: project.slug })} onClick={(event) => open(event, project.slug)}>
                <span className="project-card__image">
                  <LoadedImage src={project.thumbnail} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="project-card__meta">
                  {projectTypeLabel[project.type]} · {project.year}
                </span>
                <span className="project-card__title">{project.title}</span>
                <span className="project-card__place">{placeName(project.location)}</span>
                <span className="project-card__status" data-status={project.status}>
                  {projectStatusLabel[project.status]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="project-grid__empty">
          <p>No projects match these filters.</p>
          <button type="button" className="text-action" onClick={() => setFilters({ ...noFilters, sort: filters.sort })}>
            Clear filters
          </button>
        </div>
      )}
    </main>
  );
}
