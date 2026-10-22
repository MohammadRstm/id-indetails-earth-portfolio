import { describe, expect, it } from 'vitest';
import type { Project } from '../data/project';
import { testProjects } from '../test/projects';
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
const only = (overrides: Partial<ProjectFilters>) => filterProjects(testProjects, { ...noFilters, ...overrides });

describe('filterProjects', () => {
  it('keeps everything with no filters', () => {
    expect(filterProjects(testProjects, noFilters)).toHaveLength(testProjects.length);
  });

  it('filters by type, status, year and country', () => {
    expect(only({ type: 'hotel' }).every((project) => project.type === 'hotel')).toBe(true);
    expect(only({ status: 'in-progress' }).every((project) => project.status === 'in-progress')).toBe(true);
    expect(slugs(only({ year: 2022 })).sort()).toEqual(['byblos-harbour-hotel', 'clifton-bay-house']);
    expect(slugs(only({ country: 'Lebanon' })).sort()).toEqual(['batroun-cliff-villa', 'byblos-harbour-hotel', 'corniche-residences']);
  });

  it('combines filters', () => {
    expect(slugs(only({ type: 'hotel', status: 'completed' })).sort()).toEqual(['byblos-harbour-hotel', 'marina-crown-hotel']);
  });

  it('searches title, client, city and country, ignoring case and accents', () => {
    expect(slugs(only({ search: 'harbour hotel' }))).toEqual(['byblos-harbour-hotel']);
    expect(slugs(only({ search: 'JBEIL heritage' }))).toEqual(['byblos-harbour-hotel']);
    expect(slugs(only({ search: 'lisbon' }))).toEqual(['alfama-lofts']);
    expect(slugs(only({ search: 'mexico' }))).toEqual(['tulum-beach-hotel']);
    expect(only({ search: 'nothing like this' })).toEqual([]);
  });

  it('still searches a project with no city, by its country', () => {
    const countryOnly = { ...testProjects[0], location: { ...testProjects[0].location, city: null } };
    expect(filterProjects([countryOnly], { ...noFilters, search: 'portugal' })).toHaveLength(1);
    expect(filterProjects([countryOnly], { ...noFilters, search: 'lisbon' })).toHaveLength(0);
  });
});

describe('sortProjects', () => {
  it('puts the newest first by default, then titles A to Z', () => {
    const years = sortProjects(testProjects, 'newest').map((project) => project.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('can put the oldest first or sort by title', () => {
    const years = sortProjects(testProjects, 'oldest').map((project) => project.year);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    const titles = sortProjects(testProjects, 'title').map((project) => project.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('leaves the original list alone', () => {
    const before = slugs(testProjects);
    sortProjects(testProjects, 'title');
    expect(slugs(testProjects)).toEqual(before);
  });
});

describe('filterOptions', () => {
  it('offers only the values the projects have, years newest first', () => {
    const options = filterOptions(testProjects);
    expect(new Set(options.types.map((type) => type.key))).toEqual(new Set(testProjects.map((project) => project.type)));
    expect(options.types).toContainEqual({ key: 'hotel', label: 'Hotel' });
    expect(options.types.map((type) => type.label)).toEqual([...options.types.map((type) => type.label)].sort((a, b) => a.localeCompare(b)));
    expect(options.years[0]).toBe(Math.max(...testProjects.map((project) => project.year)));
    expect(options.countries).toContain('Lebanon');
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

  it('takes any type the dashboard could have made', () => {
    expect(filtersFromQuery('type=beach-house').type).toBe('beach-house');
  });

  it('ignores unknown and malformed values', () => {
    expect(filtersFromQuery('type=Beach%20House&status=lost&year=soon&sort=random&q=')).toEqual(noFilters);
  });
});
