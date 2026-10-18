import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { demoProjects } from '../data/demoProjects';
import { offices } from '../data/offices';
import { decodeCountries, findCountry, isArtificialEdge, polygonContains, segmentPositions, unwrapRing, type Ring } from './countries';

const atlas = JSON.parse(readFileSync(fileURLToPath(new URL('../../node_modules/world-atlas/countries-50m.json', import.meta.url)), 'utf8'));
const data = decodeCountries(atlas);

describe('decodeCountries', () => {
  it('reads every country with a name and at least one polygon', () => {
    expect(data.countries.length).toBeGreaterThan(200);
    for (const country of data.countries) {
      expect(country.name).not.toBe('');
      expect(country.polygons.length, country.name).toBeGreaterThan(0);
    }
  });

  it('separates coastlines from land borders', () => {
    expect(data.coasts.length).toBeGreaterThan(0);
    expect(data.borders.length).toBeGreaterThan(0);
  });
});

describe('findCountry', () => {
  it('puts every demo project in the country it names', () => {
    const expected: Record<string, string> = {
      'United States': 'United States of America',
    };
    for (const { slug, location } of demoProjects) {
      const country = findCountry(data.countries, location.lng, location.lat);
      expect(country?.name, slug).toBe(expected[location.country] ?? location.country);
    }
  });

  it('puts every office in the country it names', () => {
    for (const office of offices) {
      expect(findCountry(data.countries, office.lng, office.lat)?.name, office.city).toBe(office.country);
    }
  });
});

describe('ring helpers', () => {
  it('keeps a ring across the antimeridian continuous', () => {
    expect(unwrapRing([[179, 0], [-179, 1], [-178, 0]])).toEqual([[179, 0], [181, 1], [182, 0]]);
  });

  it('finds points inside a polygon that crosses the antimeridian, on either side', () => {
    const square: Ring = [[178, -1], [-178, -1], [-178, 1], [178, 1], [178, -1]];
    expect(polygonContains([square], 179.5, 0)).toBe(true);
    expect(polygonContains([square], -179.5, 0)).toBe(true);
    expect(polygonContains([square], 170, 0)).toBe(false);
  });

  it('treats holes as outside', () => {
    const outer: Ring = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]];
    const hole: Ring = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
    expect(polygonContains([outer, hole], 2, 2)).toBe(true);
    expect(polygonContains([outer, hole], 5, 5)).toBe(false);
  });

  it('flags the cuts along the antimeridian and the pole, not real edges', () => {
    expect(isArtificialEdge([180, 60], [180, 65])).toBe(true);
    expect(isArtificialEdge([-180, 60], [-180, 65])).toBe(true);
    expect(isArtificialEdge([10, -90], [20, -90])).toBe(true);
    expect(isArtificialEdge([179, 60], [180, 61])).toBe(false);
    expect(isArtificialEdge([10, 40], [11, 41])).toBe(false);
  });
});

describe('segmentPositions', () => {
  const pointsOf = (positions: Float32Array) =>
    Array.from({ length: positions.length / 3 }, (_, i) => Math.hypot(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]));

  it('puts every point on the requested sphere', () => {
    const positions = segmentPositions([[[0, 0], [0.5, 0.5], [1, 0]]], 1.5);
    expect(positions.length).toBe(2 * 2 * 3);
    for (const radius of pointsOf(positions)) expect(radius).toBeCloseTo(1.5, 5);
  });

  it('splits long edges so they follow the curve', () => {
    expect(segmentPositions([[[0, 0], [10, 0]]], 1).length).toBe(10 * 2 * 3);
  });

  it('skips the cuts along the antimeridian', () => {
    expect(segmentPositions([[[180, 60], [180, 65]]], 1).length).toBe(0);
  });

  it('takes the short way across the antimeridian', () => {
    expect(segmentPositions([[[179.7, 0], [-179.7, 0]]], 1).length).toBe(2 * 3);
  });
});
