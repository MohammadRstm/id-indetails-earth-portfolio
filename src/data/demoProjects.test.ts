import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formatStartDate } from '../lib/format';
import { demoProjects } from './demoProjects';
import { projectStatusLabel } from './project';
import { fetchProjects } from './projectSource';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));

describe('demoProjects', () => {
  it('has projects with unique, non-empty ids', () => {
    expect(demoProjects.length).toBeGreaterThan(0);
    const ids = demoProjects.map((project) => project.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('places every project on the globe', () => {
    for (const { id, location } of demoProjects) {
      expect(location.lat, id).toBeGreaterThanOrEqual(-90);
      expect(location.lat, id).toBeLessThanOrEqual(90);
      expect(location.lng, id).toBeGreaterThanOrEqual(-180);
      expect(location.lng, id).toBeLessThanOrEqual(180);
      expect(location.city, id).not.toBe('');
      expect(location.country, id).not.toBe('');
    }
  });

  it('has exactly one featured project', () => {
    expect(demoProjects.filter((project) => project.featured)).toHaveLength(1);
  });

  it('only points at image files that exist in public/', () => {
    const withImages = demoProjects.filter((project) => project.image);
    expect(withImages.length).toBeGreaterThan(0);
    for (const { id, image } of withImages) {
      expect(image?.src.startsWith('/'), `${id} image path`).toBe(true);
      expect(existsSync(publicDir + image?.src.slice(1)), `${id}: ${image?.src}`).toBe(true);
      expect(image?.alt.trim(), `${id} alt text`).not.toBe('');
    }
  });

  it('uses known statuses, valid dates and valid time zones', () => {
    for (const { id, status, startDate, location } of demoProjects) {
      expect(Object.keys(projectStatusLabel), id).toContain(status);
      if (startDate) expect(formatStartDate(startDate), `${id} start date`).not.toBeNull();
      if (location.timeZone) {
        expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: location.timeZone }), `${id} time zone`).not.toThrow();
      }
    }
  });
});

describe('fetchProjects', () => {
  it('resolves the demonstration projects', async () => {
    await expect(fetchProjects()).resolves.toBe(demoProjects);
  });

  it('rejects with an AbortError when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchProjects(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
