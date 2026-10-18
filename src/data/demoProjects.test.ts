import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { demoProjects } from './demoProjects';
import { CONVEYOR_LIMIT, projectStatusLabel, projectTypeLabel } from './project';
import { fetchProjects } from './projectSource';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));

describe('demoProjects', () => {
  it('has projects with unique ids and unique, URL-safe slugs', () => {
    expect(demoProjects.length).toBeGreaterThan(1);
    const ids = demoProjects.map((project) => project.id);
    const slugs = demoProjects.map((project) => project.slug);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('marks no more projects for the strip than it can show, each with its own place in it', () => {
    const marked = demoProjects.filter((project) => project.showInConveyor);
    expect(marked.length).toBeLessThanOrEqual(CONVEYOR_LIMIT);
    for (const project of marked) expect(project.conveyorOrder, project.slug).not.toBeNull();
    const orders = marked.map((project) => project.conveyorOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('places every project on the globe', () => {
    for (const { slug: id, location } of demoProjects) {
      expect(location.lat, id).toBeGreaterThanOrEqual(-90);
      expect(location.lat, id).toBeLessThanOrEqual(90);
      expect(location.lng, id).toBeGreaterThanOrEqual(-180);
      expect(location.lng, id).toBeLessThanOrEqual(180);
      expect(location.city, id).not.toBe('');
      expect(location.country, id).not.toBe('');
    }
  });

  it('fills in every field with a known type and status', () => {
    for (const { slug: id, type, status, year, client, description } of demoProjects) {
      expect(Object.keys(projectTypeLabel), id).toContain(type);
      expect(Object.keys(projectStatusLabel), id).toContain(status);
      expect(Number.isInteger(year), id).toBe(true);
      expect(client.trim(), id).not.toBe('');
      expect(description.trim(), id).not.toBe('');
    }
  });

  it('only points at image files that exist in public/, each with alt text and a credit', () => {
    for (const project of demoProjects) {
      const images = [project.hero, ...project.gallery];
      for (const src of [project.thumbnail, ...images.map((image) => image.src)]) {
        expect(src.startsWith('/'), `${project.slug}: ${src}`).toBe(true);
        expect(existsSync(publicDir + src.slice(1)), `${project.slug}: ${src}`).toBe(true);
      }
      for (const image of images) {
        expect(image.alt.trim(), `${project.slug}: ${image.src} alt text`).not.toBe('');
        expect(image.credit?.url, `${project.slug}: ${image.src} credit`).toMatch(/^https:\/\//);
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
