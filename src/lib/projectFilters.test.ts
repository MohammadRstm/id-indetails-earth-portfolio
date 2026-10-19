import { describe, expect, it } from 'vitest';
import { demoProjects } from '../data/demoProjects';
import type { Project } from '../data/project';
import {
  filterOptions,
  filterProjects,
  filtersFromQuery,
  filtersToQuery,
  hasFilters,
  noFilters,
  sortProjects,
  type ProjectFilters,
} from './projectFilters';

const slugs = (projects: Project[]) => projects.map((project) => project.slug);
const only = (overrides: Partial<ProjectFilters>) => filterProjects(demoProjects, { ...noFilters, ...overrides });

describe('filterProjects', () => {
  it('keeps everything with no filters', () => {
    expect(filterProjects(demoProjects, noFilters)).toHaveLength(demoProjects.length);
  });

  it('filters by type, status, year and country', () => {
    expect(only({ type: 'hotel' }).every((project) => project.type === 'hotel')).toBe(true);
    expect(only({ status: 'in-progress' }).every((project) => project.status === 'in-progress')).toBe(true);
    expect(slugs(only({ year: 2022 })).sort()).toEqual(['atlas-riad-hotel', 'clifton-bay-house']);
    expect(slugs(only({ country: 'Greece' }))).toEqual(['aegean-cliff-villa']);
  });

  it('combines filters', () => {
    expect(slugs(only({ type: 'hotel', status: 'completed' })).sort()).toEqual(['atlas-riad-hotel', 'marina-crown-hotel']);
  });

  it('searches title, client, city and country, ignoring case and accents', () => {
    expect(slugs(only({ search: 'riad' }))).toEqual(['atlas-riad-hotel']);
    expect(slugs(only({ search: 'MAISON atlas' }))).toEqual(['atlas-riad-hotel']);
    expect(slugs(only({ search: 'lisbon' }))).toEqual(['alfama-lofts']);
    expect(slugs(only({ search: 'mexico' }))).toEqual(['tulum-beach-hotel']);
    expect(only({ search: 'nothing like this' })).toEqual([]);
  });

  it('still searches a project with no city, by its country', () => {
    const countryOnly = { ...demoProjects[0], location: { ...demoProjects[0].location, city: null } };
    expect(filterProjects([countryOnly], { ...noFilters, search: 'portugal' })).toHaveLength(1);
    expect(filterProjects([countryOnly], { ...noFilters, search: 'lisbon' })).toHaveLength(0);
  });
});

describe('sortProjects', () => {
  it('puts the newest first by default, then titles A to Z', () => {
    const years = sortProjects(demoProjects, 'newest').map((project) => project.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('can put the oldest first or sort by title', () => {
    const years = sortProjects(demoProjects, 'oldest').map((project) => project.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    const titles = sortProjects(demoProjects, 'title').map((project) => project.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('leaves the original list alone', () => {
    const before = slugs(demoProjects);
    sortProjects(demoProjects, 'title');
    expect(slugs(demoProjects)).toEqual(before);
  });
});

describe('filterOptions', () => {
  it('offers only the values the projects have, years newest first', () => {
    const options = filterOptions(demoProjects);
    expect(new Set(options.types)).toEqual(new Set(demoProjects.map((project) => project.type)));
    expect(options.years[0]).toBe(Math.max(...demoProjects.map((project) => project.year)));
    expect(options.countries).toContain('Greece');
    expect(new Set(options.countries).size).toBe(options.countries.length);
  });
});

describe('filters in the address', () => {
  it('round-trips through a query string', () => {
    const filters: ProjectFilters = { search: 'villa', type: 'villa', status: 'completed', year: 2024, country: 'Greece', sort: 'title' };
    expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters);
  });

  it('writes nothing for the defaults', () => {
    expect(filtersToQuery(noFilters)).toBe('');
    expect(hasFilters(noFilters)).toBe(false);
  });

  it('ignores unknown and malformed values', () => {
    expect(filtersFromQuery('type=castle&status=lost&year=soon&sort=random&q=')).toEqual(noFilters);
  });
});
