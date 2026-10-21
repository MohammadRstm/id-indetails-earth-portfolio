import { Euler, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { Project } from '../data/project';
import { testProjects } from '../test/projects';
import {
  formatCoordinates,
  greatCircleAngle,
  groupByLocation,
  latLngToVector,
  markerScales,
  MAX_FOCUS_PITCH,
  MIN_MARKER_SCALE,
  minimumSpanningTree,
  tagSide,
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

  it('brings every test project onto the near side of the globe', () => {
    for (const { slug, location } of testProjects) {
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
  it('gives every test project its own place', () => {
    const groups = groupByLocation(testProjects);
    expect(groups).toHaveLength(testProjects.length);
    for (const group of groups) expect(group.projects, group.id).toHaveLength(1);
  });

  it('names a group after its first project', () => {
    const [group] = groupByLocation([project('a', 10, 20), project('b', 10.05, 20.05)]);
    expect(group.id).toBe('loc-a');
    expect(group.city).toBe('a');
    expect(group.projects.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('separates projects that are further apart than the grouping distance', () => {
    // Neighbouring towns, like Beirut and Byblos, keep their own markers.
    expect(groupByLocation([project('beirut', 33.8959, 35.4784), project('byblos', 34.1211, 35.6481)])).toHaveLength(2);
    expect(groupByLocation([project('a', 10, 20), project('b', 10.9, 20)])).toHaveLength(2);
    expect(groupByLocation([project('a', 10, 20), project('b', 10, 21)])).toHaveLength(2);
  });

  it('groups projects either side of the antimeridian', () => {
    const groups = groupByLocation([project('a', -17.7, 179.97), project('b', -17.7, -179.97)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].projects).toHaveLength(2);
  });

  it('returns no groups for no projects', () => {
    expect(groupByLocation([])).toEqual([]);
  });
});

describe('markerScales', () => {
  const place = (id: string, lat: number, lng: number) => ({ id, lat, lng });

  it('keeps full-size markers for places far from each other, or alone', () => {
    expect(markerScales([place('lisbon', 38.7, -9.1), place('dubai', 25.1, 55.1)])).toEqual(
      new Map([
        ['lisbon', 1],
        ['dubai', 1],
      ]),
    );
    expect(markerScales([place('alone', 0, 0)]).get('alone')).toBe(1);
  });

  it('shrinks markers with a close neighbour, down to the smallest size', () => {
    const scales = markerScales([place('beirut', 33.8959, 35.4784), place('byblos', 34.1211, 35.6481), place('dubai', 25.1, 55.1)]);
    expect(scales.get('beirut')).toBe(MIN_MARKER_SCALE);
    expect(scales.get('byblos')).toBe(MIN_MARKER_SCALE);
    expect(scales.get('dubai')).toBe(1);
  });

  it('scales in between with the distance to the nearest place', () => {
    // 0.06 radians apart: half the spacing at which markers are full size.
    const scales = markerScales([place('a', 0, 0), place('b', 0, 0.06 / DEG)]);
    expect(scales.get('a')).toBeCloseTo(0.5);
    expect(scales.get('b')).toBeCloseTo(0.5);
  });
});

describe('tagSide', () => {
  const offices = [
    { lat: 33.8938, lng: 35.5018 },
    { lat: 5.36, lng: -4.0083 },
  ];

  it('puts the tag on the left, away from an office label at the same place or far off', () => {
    expect(tagSide({ lat: 33.8959, lng: 35.4784 }, offices)).toBe('left');
    expect(tagSide({ lat: 34.2553, lng: 35.6581 }, offices)).toBe('left');
    expect(tagSide({ lat: 38.7, lng: -9.1 }, offices)).toBe('left');
    expect(tagSide({ lat: -33.9, lng: 151.2 }, offices)).toBe('left');
  });

  it('puts the tag on the right of a place a little east of an office, where its label runs', () => {
    expect(tagSide({ lat: 25.1, lng: 55.1 }, offices)).toBe('right');
  });

  it('keeps it on the left when the office is far north or south', () => {
    expect(tagSide({ lat: -8.5, lng: 40 }, offices)).toBe('left');
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
    const places = testProjects.map((item, index) => place(`p${index}`, item.location.lat, item.location.lng));
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
