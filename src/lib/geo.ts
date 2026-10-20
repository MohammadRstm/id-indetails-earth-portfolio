import type { Project } from '../data/project';

const DEG = Math.PI / 180;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Unit-sphere position matching three.js SphereGeometry UVs with an
 * equirectangular texture: lng 0 faces +X, lng -90 faces +Z, north is +Y.
 */
export function latLngToVector(lat: number, lng: number, radius = 1): Vec3 {
  const phi = lat * DEG;
  const lambda = lng * DEG;
  return {
    x: radius * Math.cos(phi) * Math.cos(lambda),
    y: radius * Math.sin(phi),
    z: -radius * Math.cos(phi) * Math.sin(lambda),
  };
}

export interface Orientation {
  /** Rotation about the globe's polar axis, radians. */
  yaw: number;
  /** Tilt about the screen's horizontal axis, applied after yaw, radians. */
  pitch: number;
}

/** Largest tilt used when bringing a location forward, so the globe never tips over. */
export const MAX_FOCUS_PITCH = 40 * DEG;

/**
 * Globe orientation (Euler order XYZ: yaw first, then pitch) that turns the
 * location towards a camera on the +Z axis. High latitudes are only partly
 * tilted so the poles stay readable.
 */
export function orientationFor(lat: number, lng: number): Orientation {
  const pitch = Math.max(-MAX_FOCUS_PITCH, Math.min(MAX_FOCUS_PITCH, lat * DEG * 0.8));
  return { yaw: -(lng + 90) * DEG, pitch };
}

/** Wraps an angle into [-PI, PI). */
export function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((((angle + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latLabel = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngLabel = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latLabel}, ${lngLabel}`;
}

export interface LocationGroup {
  id: string;
  city: string | null;
  country: string;
  lat: number;
  lng: number;
  projects: Project[];
}

/** Projects closer than this, about 10 km (in effect the same town), share one marker. */
const GROUP_DISTANCE_DEG = 0.1;

/** Groups projects that sit at (almost) the same place into one marker. */
export function groupByLocation(projects: Project[]): LocationGroup[] {
  const groups: LocationGroup[] = [];
  for (const project of projects) {
    const { lat, lng, city, country } = project.location;
    const match = groups.find(
      (group) => Math.abs(group.lat - lat) < GROUP_DISTANCE_DEG && Math.abs(wrapAngle((group.lng - lng) * DEG)) < GROUP_DISTANCE_DEG * DEG,
    );
    if (match) {
      match.projects.push(project);
    } else {
      groups.push({ id: `loc-${project.slug}`, city, country, lat, lng, projects: [project] });
    }
  }
  return groups;
}

/** Angle in radians between two places, along the great circle through them. */
export function greatCircleAngle(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const p = latLngToVector(a.lat, a.lng);
  const q = latLngToVector(b.lat, b.lng);
  const cross = Math.hypot(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
  return Math.atan2(cross, p.x * q.x + p.y * q.y + p.z * q.z);
}

/** Places further apart than this (radians, about 7°) keep full-size markers: their ripples don't meet. */
const FULL_SIZE_SPACING = 0.12;
/** The smallest a marker gets, so a place in a tight cluster still shows. */
export const MIN_MARKER_SCALE = 0.3;

/**
 * How large each place's marker is drawn, from 1 down to MIN_MARKER_SCALE:
 * smaller the closer its nearest neighbour, so places close together (several
 * projects in one small country) stay apart instead of running into one blot.
 */
export function markerScales(places: Pick<LocationGroup, 'id' | 'lat' | 'lng'>[]): Map<string, number> {
  const scales = new Map<string, number>();
  for (const place of places) {
    let nearest = Infinity;
    for (const other of places) if (other !== place) nearest = Math.min(nearest, greatCircleAngle(place, other));
    scales.set(place.id, Math.min(1, Math.max(MIN_MARKER_SCALE, nearest / FULL_SIZE_SPACING)));
  }
  return scales;
}

/**
 * An office label runs east of its red dot, and a tag up and to the west of its place: a place this far east of
 * an office (degrees of longitude, with this much latitude either way) puts its tag on the east side instead.
 */
const OFFICE_LABEL_SPAN = { minEast: 2, maxEast: 40, lat: 15 };

/** Which side of its place the type tag sits on: up and to the left, unless an office's label is there. */
export function tagSide(place: { lat: number; lng: number }, offices: { lat: number; lng: number }[]): 'left' | 'right' {
  const officeInTheWay = offices.some((office) => {
    const east = wrapAngle((place.lng - office.lng) * DEG) / DEG;
    return east > OFFICE_LABEL_SPAN.minEast && east < OFFICE_LABEL_SPAN.maxEast && Math.abs(place.lat - office.lat) < OFFICE_LABEL_SPAN.lat;
  });
  return officeInTheWay ? 'right' : 'left';
}

export interface RouteEdge {
  from: string;
  to: string;
  /** Great-circle angle between the two places, radians. */
  angle: number;
}

/** Connects every place with the shortest total great-circle distance (Prim's algorithm), with no loops. */
export function minimumSpanningTree(places: Pick<LocationGroup, 'id' | 'lat' | 'lng'>[]): RouteEdge[] {
  if (places.length < 2) return [];
  const edges: RouteEdge[] = [];
  const joined = new Set([0]);
  while (joined.size < places.length) {
    let best: { i: number; j: number; angle: number } | null = null;
    for (const i of joined) {
      for (let j = 0; j < places.length; j++) {
        if (joined.has(j)) continue;
        const angle = greatCircleAngle(places[i], places[j]);
        if (!best || angle < best.angle) best = { i, j, angle };
      }
    }
    if (!best) break;
    joined.add(best.j);
    edges.push({ from: places[best.i].id, to: places[best.j].id, angle: best.angle });
  }
  return edges;
}
