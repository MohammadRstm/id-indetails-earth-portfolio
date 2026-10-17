import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { demoProjects } from './demoProjects';
import { projectStatusLabel, projectTypeLabel } from './project';
import { fetchProjects } from './projectSource';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));

describe('demoProjects', () => {
  it('has projects with unique, URL-safe ids', () => {
    expect(demoProjects.length).toBeGreaterThan(1);
    const ids = demoProjects.map((project) => project.id);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
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

  it('uses known types and statuses and sensible figures', () => {
    for (const { id, type, status, year, areaSqm } of demoProjects) {
      expect(Object.keys(projectTypeLabel), id).toContain(type);
      expect(Object.keys(projectStatusLabel), id).toContain(status);
      expect(Number.isInteger(year), id).toBe(true);
      expect(areaSqm, id).toBeGreaterThan(0);
    }
  });

  it('only points at image files that exist in public/, each with alt text and a credit', () => {
    for (const project of demoProjects) {
      const images = [project.hero, ...project.gallery];
      for (const src of [project.thumbnail, ...images.map((image) => image.src)]) {
        expect(src.startsWith('/'), `${project.id}: ${src}`).toBe(true);
        expect(existsSync(publicDir + src.slice(1)), `${project.id}: ${src}`).toBe(true);
      }
      for (const image of images) {
        expect(image.alt.trim(), `${project.id}: ${image.src} alt text`).not.toBe('');
        expect(image.credit?.url, `${project.id}: ${image.src} credit`).toMatch(/^https:\/\//);
      }
    }
  });

  it('never shows the same photograph twice', () => {
    const sources = demoProjects.flatMap((project) => [project.hero.src, ...project.gallery.map((image) => image.src)]);
    expect(new Set(sources).size).toBe(sources.length);
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
