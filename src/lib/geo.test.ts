import { Euler, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { demoProjects } from '../data/demoProjects';
import type { Project } from '../data/project';
import {
  formatCoordinates,
  greatCircleAngle,
  groupByLocation,
  latLngToVector,
  MAX_FOCUS_PITCH,
  minimumSpanningTree,
  orientationFor,
  wrapAngle,
} from './geo';

const DEG = Math.PI / 180;

let nextId = 1;

function project(slug: string, lat: number, lng: number): Project {
  const image = { src: `/projects/${slug}.jpg`, alt: slug };
  return {
    id: nextId++,
    slug,
    title: slug,
    type: 'villa',
    status: 'completed',
    location: { city: slug, country: 'Testland', countryCode: 'TL', lat, lng, approximate: false },
    year: 2024,
    client: 'Test client',
    description: 'Test project',
    thumbnail: image.src,
    hero: image,
    gallery: [],
    showInConveyor: true,
    conveyorOrder: null,
  };
}

/** Where a location ends up once the globe is rotated the way the scene does it. */
function faceCamera(lat: number, lng: number): Vector3 {
  const { x, y, z } = latLngToVector(lat, lng);
  const { pitch, yaw } = orientationFor(lat, lng);
  return new Vector3(x, y, z).applyEuler(new Euler(pitch, yaw, 0, 'XYZ'));
}

describe('latLngToVector', () => {
  it('puts longitude 0 on +X', () => {
    const { x, y, z } = latLngToVector(0, 0);
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it('puts longitude -90 on +Z', () => {
    const { x, y, z } = latLngToVector(0, -90);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(1);
  });

  it('puts longitude 90 on -Z and the antimeridian on -X', () => {
    expect(latLngToVector(0, 90).z).toBeCloseTo(-1);
    expect(latLngToVector(0, 180).x).toBeCloseTo(-1);
  });

  it('puts the north pole on +Y and the south pole on -Y', () => {
    const north = latLngToVector(90, 25);
    expect(north.y).toBeCloseTo(1);
    expect(north.x).toBeCloseTo(0);
    expect(north.z).toBeCloseTo(0);
    expect(latLngToVector(-90, 25).y).toBeCloseTo(-1);
  });

  it('scales with the radius and stays on the sphere', () => {
    const { x, y, z } = latLngToVector(38.72, -9.14, 1.012);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1.012);
  });
});

describe('orientationFor', () => {
  it.each([-170, -73.57, -9.14, 0, 36.82, 103.85, 144.96, 179])(
    'turns an equatorial point at longitude %d to face a camera on +Z',
    (lng) => {
      const point = faceCamera(0, lng);
      expect(orientationFor(0, lng).pitch).toBeCloseTo(0);
      expect(point.x).toBeCloseTo(0);
      expect(point.y).toBeCloseTo(0);
      expect(point.z).toBeCloseTo(1);
    },
  );

  it('centres the meridian and leans the pole slightly towards the viewer at mid latitudes', () => {
    const point = faceCamera(38.7223, -9.1393);
    expect(point.x).toBeCloseTo(0);
    expect(point.z).toBeGreaterThan(0.9);
    // Pitch covers 80% of the latitude, so the location sits a little above the centre line.
    expect(point.y).toBeCloseTo(Math.sin(38.7223 * DEG * 0.2));
  });

  it('mirrors for the southern hemisphere', () => {
    const north = faceCamera(37.8, 144.9);
    const south = faceCamera(-37.8, 144.9);
    expect(south.y).toBeCloseTo(-north.y);
    expect(south.z).toBeCloseTo(north.z);
    expect(orientationFor(-37.8, 144.9).pitch).toBeCloseTo(-orientationFor(37.8, 144.9).pitch);
  });

  it('clamps the pitch at high latitudes and keeps the location in view', () => {
    for (const lat of [64.1466, 80, 90]) {
      const { pitch } = orientationFor(lat, -21.9);
      expect(pitch).toBeCloseTo(MAX_FOCUS_PITCH);
      const point = faceCamera(lat, -21.9);
      expect(point.x).toBeCloseTo(0);
      expect(point.y).toBeGreaterThan(0);
      expect(point.z).toBeGreaterThan(0);
    }
    expect(orientationFor(-80, 10).pitch).toBeCloseTo(-MAX_FOCUS_PITCH);
  });

  it('brings every demo project onto the near side of the globe', () => {
    for (const { slug, location } of demoProjects) {
      const point = faceCamera(location.lat, location.lng);
      expect(point.z, slug).toBeGreaterThan(0.5);
      expect(Math.abs(point.x), slug).toBeLessThan(1e-9);
    }
  });
});

describe('wrapAngle', () => {
  it('leaves angles inside [-PI, PI) alone', () => {
    expect(wrapAngle(0)).toBeCloseTo(0);
    expect(wrapAngle(1.25)).toBeCloseTo(1.25);
    expect(wrapAngle(-2.5)).toBeCloseTo(-2.5);
  });

  it('wraps angles outside the range', () => {
    expect(wrapAngle(2 * Math.PI)).toBeCloseTo(0);
    expect(wrapAngle((3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
    expect(wrapAngle((-3 * Math.PI) / 2)).toBeCloseTo(Math.PI / 2);
    expect(wrapAngle(10 * 2 * Math.PI + 0.3)).toBeCloseTo(0.3);
    expect(wrapAngle(-7 * 2 * Math.PI - 0.3)).toBeCloseTo(-0.3);
  });

  it('maps PI to -PI so the result is always in [-PI, PI)', () => {
    expect(wrapAngle(Math.PI)).toBeCloseTo(-Math.PI);
    for (const angle of [-20, -6.4, -3.15, 3.15, 6.4, 20]) {
      const wrapped = wrapAngle(angle);
      expect(wrapped).toBeGreaterThanOrEqual(-Math.PI);
      expect(wrapped).toBeLessThan(Math.PI);
    }
  });
});

describe('groupByLocation', () => {
  it('gives every demo project its own place', () => {
    const groups = groupByLocation(demoProjects);
    expect(groups).toHaveLength(demoProjects.length);
    for (const group of groups) expect(group.projects, group.id).toHaveLength(1);
  });

  it('names a group after its first project', () => {
    const [group] = groupByLocation([project('a', 10, 20), project('b', 10.2, 20.2)]);
    expect(group.id).toBe('loc-a');
    expect(group.city).toBe('a');
    expect(group.projects.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('separates projects that are further apart than the grouping distance', () => {
    expect(groupByLocation([project('a', 10, 20), project('b', 10.9, 20)])).toHaveLength(2);
    expect(groupByLocation([project('a', 10, 20), project('b', 10, 21)])).toHaveLength(2);
  });

  it('groups projects either side of the antimeridian', () => {
    const groups = groupByLocation([project('a', -17.7, 179.9), project('b', -17.7, -179.9)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].projects).toHaveLength(2);
  });

  it('returns no groups for no projects', () => {
    expect(groupByLocation([])).toEqual([]);
  });
});

describe('formatCoordinates', () => {
  it('formats west and north', () => {
    expect(formatCoordinates(38.7223, -9.1393)).toBe('38.72° N, 9.14° W');
  });

  it('formats south and east', () => {
    expect(formatCoordinates(-1.2921, 36.8219)).toBe('1.29° S, 36.82° E');
  });

  it('treats zero as north and east', () => {
    expect(formatCoordinates(0, 0)).toBe('0.00° N, 0.00° E');
  });
});

describe('greatCircleAngle', () => {
  it('is zero for the same place and PI for opposite places', () => {
    expect(greatCircleAngle({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBeCloseTo(0);
    expect(greatCircleAngle({ lat: 10, lng: 20 }, { lat: -10, lng: -160 })).toBeCloseTo(Math.PI);
  });

  it('measures a quarter turn along the equator and from the equator to a pole', () => {
    expect(greatCircleAngle({ lat: 0, lng: 0 }, { lat: 0, lng: 90 })).toBeCloseTo(Math.PI / 2);
    expect(greatCircleAngle({ lat: 0, lng: 33 }, { lat: 90, lng: 0 })).toBeCloseTo(Math.PI / 2);
  });

  it('goes the short way across the antimeridian', () => {
    expect(greatCircleAngle({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeCloseTo(2 * DEG);
  });
});

describe('minimumSpanningTree', () => {
  const place = (id: string, lat: number, lng: number) => ({ id, lat, lng });

  it('has nothing to connect for fewer than two places', () => {
    expect(minimumSpanningTree([])).toEqual([]);
    expect(minimumSpanningTree([place('a', 0, 0)])).toEqual([]);
  });

  it('links every place with one fewer edge than places', () => {
    const places = [place('a', 0, 0), place('b', 0, 10), place('c', 0, 50), place('d', 40, 50)];
    expect(minimumSpanningTree(places)).toHaveLength(3);
  });

  it('picks the short edges along a line rather than the long ones', () => {
    const edges = minimumSpanningTree([place('a', 0, 0), place('b', 0, 10), place('c', 0, 30)]);
    const pairs = edges.map((edge) => [edge.from, edge.to].sort().join('-')).sort();
    expect(pairs).toEqual(['a-b', 'b-c']);
    expect(edges.reduce((sum, edge) => sum + edge.angle, 0)).toBeCloseTo(30 * DEG);
  });

  it('reaches every place exactly once', () => {
    const places = demoProjects.map((item, index) => place(`p${index}`, item.location.lat, item.location.lng));
    const edges = minimumSpanningTree(places);
    expect(edges).toHaveLength(places.length - 1);
    const reached = new Set(['p0']);
    // Edges come out in the order the tree grew, so each one attaches to a place already reached.
    for (const edge of edges) {
      expect(reached.has(edge.from)).toBe(true);
      expect(reached.has(edge.to)).toBe(false);
      reached.add(edge.to);
    }
    expect(reached.size).toBe(places.length);
  });

  it('joins places across the antimeridian directly', () => {
    const edges = minimumSpanningTree([place('east', 0, 179), place('west', 0, -179), place('middle', 0, 90)]);
    const direct = edges.find((edge) => [edge.from, edge.to].sort().join('-') === 'east-west');
    expect(direct?.angle).toBeCloseTo(2 * DEG);
  });
});
