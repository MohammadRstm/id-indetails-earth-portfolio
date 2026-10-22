import type { Office } from '../data/offices';
import { CONCEPT_LIMIT, projectStatusLabel, type Project, type ProjectImage, type ProjectStatus } from '../data/project';
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
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function countryCode(source: Json, what: string): string {
  const code = text(source, 'countryCode', what);
  if (!COUNTRY_CODE_PATTERN.test(code)) throw new ParseError(`${what}.countryCode "${code}" is not an ISO 3166-1 alpha-2 code`);
  return code;
}

function flag(source: Json, key: string, what: string): boolean {
  const value = source[key];
  if (typeof value !== 'boolean') throw new ParseError(`${what}.${key} is not true or false`);
  return value;
}

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

/** A type's label from its key, for an API that predates `typeLabel`: "beach-house" is "Beach house". */
function typeLabelOf(key: string): string {
  const words = key.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function image(value: unknown, what: string): ProjectImage {
  const source = object(value, what);
  return {
    src: resolveAssetUrl(text(source, 'src', what)),
    alt: text(source, 'alt', what, { allowEmpty: true }),
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
  // Both concept fields are optional, and missing from an API that predates them.
  const conceptImages = source.conceptImages ?? [];
  if (!Array.isArray(conceptImages)) throw new ParseError(`${what}.conceptImages is not a list`);
  const conceptDescription = source.conceptDescription == null ? '' : text(source, 'conceptDescription', what, { allowEmpty: true });
  const conveyorOrder = source.conveyorOrder ?? null;
  if (conveyorOrder !== null && (typeof conveyorOrder !== 'number' || !Number.isFinite(conveyorOrder))) {
    throw new ParseError(`${what}.conveyorOrder is not a number`);
  }
  return {
    id: number(source, 'id', what),
    slug,
    title: text(source, 'title', what),
    type: text(source, 'type', what),
    // optional: missing from an API that predates it
    typeLabel: source.typeLabel == null ? typeLabelOf(text(source, 'type', what)) : text(source, 'typeLabel', what),
    status: oneOf<ProjectStatus>(source, 'status', projectStatusLabel, what),
    client: text(source, 'client', what, { allowEmpty: true }),
    location: {
      city: location.city === null ? null : text(location, 'city', `${what}.location`),
      country: text(location, 'country', `${what}.location`),
      countryCode: countryCode(location, `${what}.location`),
      lat: number(location, 'lat', `${what}.location`, [-90, 90]),
      lng: number(location, 'lng', `${what}.location`, [-180, 180]),
      approximate: flag(location, 'approximate', `${what}.location`),
    },
    year: Math.trunc(number(source, 'year', what)),
    description: text(source, 'description', what),
    thumbnail: resolveAssetUrl(text(source, 'thumbnail', what)),
    hero: image(source.hero, `${what}.hero`),
    gallery: gallery.map((item, index) => image(item, `${what}.gallery[${index}]`)),
    conceptDescription: conceptDescription.trim() === '' ? null : conceptDescription,
    conceptImages: conceptImages.slice(0, CONCEPT_LIMIT).map((item, index) => image(item, `${what}.conceptImages[${index}]`)),
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
    countryCode: countryCode(source, 'location'),
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

/** The favicon is null until one is chosen. An API from before the under-construction switch sends no flag: off. */
export function parseSiteSettings(value: unknown): SiteSettings {
  const source = object(value, 'settings');
  return {
    faviconUrl: source.faviconUrl === null ? null : resolveAssetUrl(text(source, 'faviconUrl', 'settings')),
    underConstruction: source.underConstruction === undefined ? false : flag(source, 'underConstruction', 'settings'),
  };
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
