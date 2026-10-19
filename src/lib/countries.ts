import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { greatCircleAngle, latLngToVector } from './geo';

/** Longer edges are split so their chords follow the curve of the planet. */
const MAX_SEGMENT_RADIANS = (1 * Math.PI) / 180;

/** [longitude, latitude] in degrees, as in GeoJSON. */
export type LngLat = [number, number];
export type Ring = LngLat[];

export interface CountryShape {
  /** ISO 3166-1 numeric code, as used by Natural Earth. */
  id: string;
  name: string;
  /** Polygons, each an outer ring followed by any holes. */
  polygons: Ring[][];
}

export interface CountryData {
  countries: CountryShape[];
  /** Coastlines: edges with land on one side only. */
  coasts: LngLat[][];
  /** Land borders between two countries. */
  borders: LngLat[][];
}

interface CountryProperties {
  name: string;
}

type CountriesTopology = Topology<{ countries: GeometryCollection<CountryProperties> }>;

/** Decodes the Natural Earth countries TopoJSON from the `world-atlas` package. */
export function decodeCountries(topology: CountriesTopology): CountryData {
  const object = topology.objects.countries;
  const countries = feature(topology, object).features.flatMap((country): CountryShape[] => {
    const { geometry } = country;
    if (!geometry) return [];
    const polygons =
      geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    return [{ id: String(country.id ?? ''), name: country.properties.name, polygons: polygons as Ring[][] }];
  });
  const lines = (filter: (a: unknown, b: unknown) => boolean) => mesh(topology, object, filter).coordinates as LngLat[][];
  return {
    countries,
    coasts: lines((a, b) => a === b),
    borders: lines((a, b) => a !== b),
  };
}

/** Rewrites longitudes so consecutive points never jump by more than 180°, which keeps rings across the antimeridian whole. */
export function unwrapRing(ring: Ring): Ring {
  const result: Ring = [];
  let offset = 0;
  ring.forEach(([lng, lat], index) => {
    if (index > 0) {
      const previous = ring[index - 1][0];
      if (lng - previous > 180) offset -= 360;
      else if (previous - lng > 180) offset += 360;
    }
    result.push([lng + offset, lat]);
  });
  return result;
}

function ringContains(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

interface PreparedPolygon {
  rings: Ring[];
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

/** Unwrapped rings and the outer ring's bounds, worked out once per polygon: lookups run every time the project changes. */
const prepared = new WeakMap<Ring[], PreparedPolygon>();

function prepare(polygon: Ring[]): PreparedPolygon {
  let result = prepared.get(polygon);
  if (!result) {
    const rings = polygon.map(unwrapRing);
    const lngs = rings[0].map(([lng]) => lng);
    const lats = rings[0].map(([, lat]) => lat);
    result = { rings, minLng: Math.min(...lngs), maxLng: Math.max(...lngs), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
    prepared.set(polygon, result);
  }
  return result;
}

/** Even-odd test in longitude/latitude, trying the point a turn either side for rings that cross the antimeridian. */
export function polygonContains(polygon: Ring[], lng: number, lat: number): boolean {
  const { rings, minLng, maxLng, minLat, maxLat } = prepare(polygon);
  if (lat < minLat || lat > maxLat) return false;
  return [lng, lng - 360, lng + 360].some(
    (x) => x >= minLng && x <= maxLng && rings.filter((ring) => ringContains(ring, x, lat)).length % 2 === 1,
  );
}

const found = new WeakMap<CountryShape[], Map<string, CountryShape | null>>();

/**
 * The country a place lies in. Small islands are missing at this map scale,
 * so a place outside every polygon falls back to the country with the
 * nearest outline point. Answers are remembered per place.
 */
export function findCountry(countries: CountryShape[], lng: number, lat: number): CountryShape | null {
  let cache = found.get(countries);
  if (!cache) {
    cache = new Map();
    found.set(countries, cache);
  }
  const key = `${lng},${lat}`;
  if (!cache.has(key)) cache.set(key, searchCountry(countries, lng, lat));
  return cache.get(key) ?? null;
}

function searchCountry(countries: CountryShape[], lng: number, lat: number): CountryShape | null {
  const containing = countries.find((country) => country.polygons.some((polygon) => polygonContains(polygon, lng, lat)));
  if (containing) return containing;

  let nearest: CountryShape | null = null;
  let best = Infinity;
  for (const country of countries) {
    for (const polygon of country.polygons) {
      for (const [x, y] of polygon[0]) {
        const angle = greatCircleAngle({ lat, lng }, { lat: y, lng: x });
        if (angle < best) {
          best = angle;
          nearest = country;
        }
      }
    }
  }
  return nearest;
}

/**
 * Edges the map adds where shapes are cut along the antimeridian or closed at
 * the South Pole. They are not real borders, so they are not drawn.
 */
export function isArtificialEdge([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): boolean {
  const onAntimeridian = Math.abs(lng1) > 179.99 && Math.abs(lng2) > 179.99 && Math.sign(lng1) === Math.sign(lng2);
  const atPole = lat1 < -89.9 && lat2 < -89.9;
  return onAntimeridian || atPole;
}

/** Flat [x, y, z, x, y, z, …] pairs, one pair per drawn segment, on a sphere of `radius`. */
export function segmentPositions(lines: LngLat[][], radius: number): Float32Array {
  const values: number[] = [];
  const push = (lng: number, lat: number) => {
    const { x, y, z } = latLngToVector(lat, lng, radius);
    values.push(x, y, z);
  };
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      if (isArtificialEdge(a, b)) continue;
      const pieces = Math.max(1, Math.ceil(greatCircleAngle({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] }) / MAX_SEGMENT_RADIANS));
      let previous = a;
      for (let step = 1; step <= pieces; step++) {
        // Straight interpolation in degrees is close enough at a degree per piece.
        let deltaLng = b[0] - a[0];
        if (deltaLng > 180) deltaLng -= 360;
        else if (deltaLng < -180) deltaLng += 360;
        const t = step / pieces;
        const next: LngLat = [a[0] + deltaLng * t, a[1] + (b[1] - a[1]) * t];
        push(previous[0], previous[1]);
        push(next[0], next[1]);
        previous = next;
      }
    }
  }
  return new Float32Array(values);
}
