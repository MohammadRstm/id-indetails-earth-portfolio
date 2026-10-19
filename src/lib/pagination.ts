export const GRID_PAGE_SIZE = 12;

/** Always at least one page, so an empty list still has a page to show. */
export const pageCount = (total: number, size = GRID_PAGE_SIZE) => Math.max(1, Math.ceil(total / size));

export const clampPage = (page: number, count: number) => Math.min(Math.max(1, page), count);

export const pageItems = <T>(items: T[], page: number, size = GRID_PAGE_SIZE) => items.slice((page - 1) * size, page * size);

/** Reads `?page=2`; anything missing or not a whole number from 1 up is the first page. */
export function pageFromQuery(search: string): number {
  const page = Number(new URLSearchParams(search).get('page'));
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/** The first page needs no query, so the home page keeps its plain address. */
export const pageToQuery = (page: number) => (page > 1 ? `page=${page}` : '');

const MAX_LINKS = 7;

/**
 * The page numbers to offer: every page when there are few, otherwise the
 * first, the last and those either side of the current one, with null
 * marking a gap.
 */
export function pageLinks(current: number, count: number): (number | null)[] {
  if (count <= MAX_LINKS) return Array.from({ length: count }, (_, index) => index + 1);
  const pages = [...new Set([1, current - 1, current, current + 1, count])].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);
  return pages.flatMap((page, index) => (index > 0 && page - pages[index - 1] > 1 ? [null, page] : [page]));
}
