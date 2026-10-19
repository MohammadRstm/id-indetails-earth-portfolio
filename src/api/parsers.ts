import type { Office } from '../data/offices';
import {
  projectStatusLabel,
  projectTypeLabel,
  type ImageCredit,
  type Project,
  type ProjectImage,
  type ProjectStatus,
  type ProjectType,
} from '../data/project';
import type { ContactInfo, Service, SiteSettings, SocialLink } from '../data/site';
import { resolveAssetUrl } from './config';

/**
 * Checks what the API sends against the shapes the site relies on. A bad row
 * in a list is dropped (and logged) so one broken record cannot take the
 * whole page down; a bad single object is an error.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

type Json = Record<string, unknown>;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 100;

function object(value: unknown, what: string): Json {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ParseError(`${what} is not an object`);
  return value as Json;
}

function text(source: Json, key: string, what: string, { allowEmpty = false } = {}): string {
  const value = source[key];
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) throw new ParseError(`${what}.${key} is missing`);
  return value;
}

function number(source: Json, key: string, what: string, range?: [number, number]): number {
  const value = source[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new ParseError(`${what}.${key} is not a number`);
  if (range && (value < range[0] || value > range[1])) throw new ParseError(`${what}.${key} is out of range`);
  return value;
}

function oneOf<T extends string>(source: Json, key: string, allowed: Record<T, string>, what: string): T {
  const value = source[key];
  if (typeof value !== 'string' || !(value in allowed)) throw new ParseError(`${what}.${key} is not a known value`);
  return value as T;
}

function credit(value: unknown, what: string): ImageCredit | undefined {
  if (value === undefined || value === null) return undefined;
  const source = object(value, what);
  return {
    photographer: text(source, 'photographer', what),
    source: text(source, 'source', what) as ImageCredit['source'],
    url: text(source, 'url', what),
  };
}

function image(value: unknown, what: string): ProjectImage {
  const source = object(value, what);
  return {
    src: resolveAssetUrl(text(source, 'src', what)),
    alt: text(source, 'alt', what, { allowEmpty: true }),
    credit: credit(source.credit, `${what}.credit`),
  };
}

export function parseProject(value: unknown): Project {
  const source = object(value, 'project');
  const slug = text(source, 'slug', 'project');
  if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX_LENGTH) throw new ParseError(`project.slug "${slug}" is not URL-safe`);
  const what = `project ${slug}`;
  const location = object(source.location, `${what}.location`);
  const gallery = source.gallery ?? [];
  if (!Array.isArray(gallery)) throw new ParseError(`${what}.gallery is not a list`);
  const conveyorOrder = source.conveyorOrder ?? null;
  if (conveyorOrder !== null && (typeof conveyorOrder !== 'number' || !Number.isFinite(conveyorOrder))) {
    throw new ParseError(`${what}.conveyorOrder is not a number`);
  }
  return {
    id: number(source, 'id', what),
    slug,
    title: text(source, 'title', what),
    type: oneOf<ProjectType>(source, 'type', projectTypeLabel, what),
    status: oneOf<ProjectStatus>(source, 'status', projectStatusLabel, what),
    client: text(source, 'client', what, { allowEmpty: true }),
    location: {
      city: text(location, 'city', `${what}.location`),
      country: text(location, 'country', `${what}.location`),
      lat: number(location, 'lat', `${what}.location`, [-90, 90]),
      lng: number(location, 'lng', `${what}.location`, [-180, 180]),
    },
    year: Math.trunc(number(source, 'year', what)),
    description: text(source, 'description', what),
    thumbnail: resolveAssetUrl(text(source, 'thumbnail', what)),
    hero: image(source.hero, `${what}.hero`),
    gallery: gallery.map((item, index) => image(item, `${what}.gallery[${index}]`)),
    showInConveyor: source.showInConveyor === true,
    conveyorOrder: conveyorOrder as number | null,
  };
}

export function parseService(value: unknown): Service {
  const source = object(value, 'service');
  return { id: number(source, 'id', 'service'), title: text(source, 'title', 'service'), description: text(source, 'description', 'service') };
}

export function parseLocation(value: unknown): Office {
  const source = object(value, 'location');
  return {
    id: number(source, 'id', 'location'),
    city: text(source, 'city', 'location'),
    country: text(source, 'country', 'location'),
    lat: number(source, 'lat', 'location', [-90, 90]),
    lng: number(source, 'lng', 'location', [-180, 180]),
    address: text(source, 'address', 'location', { allowEmpty: true }),
    phone: text(source, 'phone', 'location', { allowEmpty: true }),
  };
}

export function parseSocialLink(value: unknown): SocialLink {
  const source = object(value, 'social link');
  const url = text(source, 'url', 'social link');
  if (!/^https?:\/\//i.test(url)) throw new ParseError(`social link url "${url}" is not a web address`);
  return { id: number(source, 'id', 'social link'), label: text(source, 'label', 'social link'), url };
}

/** The contact email is null until the company sets one. */
export function parseContactInfo(value: unknown): ContactInfo {
  const source = object(value, 'contact');
  return { email: source.email === null ? null : text(source, 'email', 'contact') };
}

/** The favicon is null until one is chosen. */
export function parseSiteSettings(value: unknown): SiteSettings {
  const source = object(value, 'settings');
  return { faviconUrl: source.faviconUrl === null ? null : resolveAssetUrl(text(source, 'faviconUrl', 'settings')) };
}

/** Parses each row, dropping (and logging) any that do not fit, so the rest still show. */
export function parseList<T>(value: unknown, parse: (row: unknown) => T, what: string): T[] {
  if (!Array.isArray(value)) throw new ParseError(`${what} is not a list`);
  return value.flatMap((row) => {
    try {
      return [parse(row)];
    } catch (error) {
      console.warn(`Skipped a ${what} entry the site cannot show.`, error);
      return [];
    }
  });
}
