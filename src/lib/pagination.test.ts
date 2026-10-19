import { describe, expect, it } from 'vitest';
import { clampPage, GRID_PAGE_SIZE, pageCount, pageFromQuery, pageItems, pageLinks, pageToQuery } from './pagination';

describe('pageCount and pageItems', () => {
  it('splits a list into pages of the grid size, the last one partly filled', () => {
    const items = Array.from({ length: 30 }, (_, index) => index);
    expect(GRID_PAGE_SIZE).toBe(12);
    expect(pageCount(items.length)).toBe(3);
    expect(pageItems(items, 1)).toEqual(items.slice(0, 12));
    expect(pageItems(items, 3)).toEqual(items.slice(24));
  });

  it('has one page for an exact fit and for no items at all', () => {
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
    expect(pageCount(0)).toBe(1);
  });
});

describe('clampPage', () => {
  it('keeps the page within the pages there are', () => {
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(2, 3)).toBe(2);
    expect(clampPage(99, 3)).toBe(3);
  });
});

describe('the page in the address', () => {
  it('reads a page number and falls back to the first page', () => {
    expect(pageFromQuery('?page=2')).toBe(2);
    expect(pageFromQuery('')).toBe(1);
    for (const search of ['?page=0', '?page=-1', '?page=1.5', '?page=two', '?page=']) expect(pageFromQuery(search), search).toBe(1);
  });

  it('leaves the first page out of the address', () => {
    expect(pageToQuery(1)).toBe('');
    expect(pageToQuery(3)).toBe('page=3');
    expect(pageFromQuery(`?${pageToQuery(3)}`)).toBe(3);
  });
});

describe('pageLinks', () => {
  it('offers every page when there are few', () => {
    expect(pageLinks(1, 1)).toEqual([1]);
    expect(pageLinks(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('offers the ends and the neighbours of the current page, with gaps between', () => {
    expect(pageLinks(1, 20)).toEqual([1, 2, null, 20]);
    expect(pageLinks(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(pageLinks(3, 20)).toEqual([1, 2, 3, 4, null, 20]);
    expect(pageLinks(20, 20)).toEqual([1, null, 19, 20]);
  });
});
