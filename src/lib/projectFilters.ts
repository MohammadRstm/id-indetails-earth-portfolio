import { projectStatusLabel, projectTypeLabel, type Project, type ProjectStatus, type ProjectType } from '../data/project';

export type ProjectSort = 'newest' | 'oldest' | 'title';

export interface ProjectFilters {
  search: string;
  type: ProjectType | null;
  status: ProjectStatus | null;
  year: number | null;
  country: string | null;
  sort: ProjectSort;
}

export const noFilters: ProjectFilters = { search: '', type: null, status: null, year: null, country: null, sort: 'newest' };

const SORTS: ProjectSort[] = ['newest', 'oldest', 'title'];

/** Lower case without accents, so "cote" finds "Côte d'Ivoire". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  const words = fold(filters.search).split(/\s+/).filter(Boolean);
  return projects.filter((project) => {
    if (filters.type && project.type !== filters.type) return false;
    if (filters.status && project.status !== filters.status) return false;
    if (filters.year !== null && project.year !== filters.year) return false;
    if (filters.country && project.location.country !== filters.country) return false;
    if (words.length === 0) return true;
    const haystack = fold([project.title, project.client, project.location.city, project.location.country].join(' '));
    return words.every((word) => haystack.includes(word));
  });
}

export function sortProjects(projects: Project[], sort: ProjectSort): Project[] {
  const byTitle = (a: Project, b: Project) => a.title.localeCompare(b.title);
  const sorted = [...projects];
  if (sort === 'title') return sorted.sort(byTitle);
  const direction = sort === 'newest' ? -1 : 1;
  return sorted.sort((a, b) => (a.year - b.year) * direction || byTitle(a, b));
}

/** The values each filter can take: only those the projects actually have. */
export function filterOptions(projects: Project[]) {
  const unique = <T,>(values: T[]) => [...new Set(values)];
  return {
    types: unique(projects.map((project) => project.type)).sort((a, b) => projectTypeLabel[a].localeCompare(projectTypeLabel[b])),
    statuses: unique(projects.map((project) => project.status)).sort((a, b) =>
      projectStatusLabel[a].localeCompare(projectStatusLabel[b]),
    ),
    years: unique(projects.map((project) => project.year)).sort((a, b) => b - a),
    countries: unique(projects.map((project) => project.location.country)).sort((a, b) => a.localeCompare(b)),
  };
}

export const hasFilters = (filters: ProjectFilters) =>
  filters.search.trim() !== '' || filters.type !== null || filters.status !== null || filters.year !== null || filters.country !== null;

/** Filters as a query string, so a filtered list can be shared and comes back after visiting a project. */
export function filtersToQuery(filters: ProjectFilters): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.year !== null) params.set('year', String(filters.year));
  if (filters.country) params.set('country', filters.country);
  if (filters.sort !== noFilters.sort) params.set('sort', filters.sort);
  return params.toString();
}

/** Reads filters back from a query string, ignoring anything unknown or malformed. */
export function filtersFromQuery(query: string): ProjectFilters {
  const params = new URLSearchParams(query);
  const type = params.get('type');
  const status = params.get('status');
  const year = Number(params.get('year'));
  const sort = params.get('sort');
  return {
    search: params.get('q') ?? '',
    type: type && type in projectTypeLabel ? (type as ProjectType) : null,
    status: status && status in projectStatusLabel ? (status as ProjectStatus) : null,
    year: params.has('year') && Number.isInteger(year) ? year : null,
    country: params.get('country') || null,
    sort: SORTS.includes(sort as ProjectSort) ? (sort as ProjectSort) : noFilters.sort,
  };
}
