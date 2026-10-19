import { projectStatusLabel, projectTypeLabel } from '../data/project';
import { filterOptions, hasFilters, type ProjectFilters, type ProjectSort } from '../lib/projectFilters';

const SORT_LABELS: Record<ProjectSort, string> = { newest: 'Newest first', oldest: 'Oldest first', title: 'Title A to Z' };

interface ProjectFilterBarProps {
  filters: ProjectFilters;
  /** The values each filter can take, from `filterOptions`. */
  options: ReturnType<typeof filterOptions>;
  onChange: (changes: Partial<ProjectFilters>) => void;
  onClear: () => void;
}

/** The search, the filters and the sort above the grid of projects. */
export function ProjectFilterBar({ filters, options, onChange, onClear }: ProjectFilterBarProps) {
  return (
    <form className="filters" role="search" aria-label="Filter projects" onSubmit={(event) => event.preventDefault()}>
      <label className="filters__field filters__field--search">
        <span className="filters__label">Search</span>
        <input
          className="filters__input"
          type="search"
          placeholder="Name, client, city or country"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </label>
      <label className="filters__field">
        <span className="filters__label">Type</span>
        <select
          className="filters__input"
          value={filters.type ?? ''}
          onChange={(event) => onChange({ type: (event.target.value || null) as ProjectFilters['type'] })}
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
          onChange={(event) => onChange({ status: (event.target.value || null) as ProjectFilters['status'] })}
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
          onChange={(event) => onChange({ year: event.target.value ? Number(event.target.value) : null })}
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
        <select className="filters__input" value={filters.country ?? ''} onChange={(event) => onChange({ country: event.target.value || null })}>
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
        <select className="filters__input" value={filters.sort} onChange={(event) => onChange({ sort: event.target.value as ProjectSort })}>
          {(Object.keys(SORT_LABELS) as ProjectSort[]).map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="filters__clear" disabled={!hasFilters(filters)} onClick={onClear}>
        Clear filters
      </button>
    </form>
  );
}
