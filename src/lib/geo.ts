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
  city: string;
  country: string;
  lat: number;
  lng: number;
  projects: Project[];
}

/** Projects closer than this share one marker. */
const GROUP_DISTANCE_DEG = 0.75;

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
      groups.push({ id: `loc-${project.id}`, city, country, lat, lng, projects: [project] });
    }
  }
  return groups;
}
