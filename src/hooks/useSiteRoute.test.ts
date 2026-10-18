import { describe, expect, it } from 'vitest';
import { pathFor, routeFromPath } from './useSiteRoute';

describe('site addresses', () => {
  it('reads the pages', () => {
    expect(routeFromPath('/')).toEqual({ page: 'home' });
    expect(routeFromPath('/projects')).toEqual({ page: 'projects' });
    expect(routeFromPath('/projects/')).toEqual({ page: 'projects' });
    expect(routeFromPath('/studio')).toEqual({ page: 'studio' });
    expect(routeFromPath('/studio/')).toEqual({ page: 'studio' });
    expect(routeFromPath('/contact')).toEqual({ page: 'contact' });
  });

  it('reads a project slug from its address', () => {
    expect(routeFromPath('/projects/alfama-lofts')).toEqual({ page: 'project', slug: 'alfama-lofts' });
    expect(routeFromPath('/projects/alfama-lofts/')).toEqual({ page: 'project', slug: 'alfama-lofts' });
  });

  it('treats every other address as the globe', () => {
    for (const path of ['/projects/a/b', '/about', '/studio/team', '/project']) {
      expect(routeFromPath(path), path).toEqual({ page: 'home' });
    }
  });

  it('ignores malformed escapes instead of throwing', () => {
    expect(routeFromPath('/projects/%E0%A4%A')).toEqual({ page: 'home' });
  });

  it('round-trips every route through its address', () => {
    for (const route of [
      { page: 'home' },
      { page: 'projects' },
      { page: 'studio' },
      { page: 'contact' },
      { page: 'project', slug: 'alfama-lofts' },
      { page: 'project', slug: 'a b' },
      { page: 'project', slug: 'ü' },
    ] as const) {
      expect(routeFromPath(pathFor(route))).toEqual(route);
    }
  });
});
