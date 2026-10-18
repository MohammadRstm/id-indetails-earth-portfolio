import type { Office } from '../data/offices';
import type { Project } from '../data/project';
import type { ContactInfo, Service, SiteSettings, SocialLink } from '../data/site';
import type { ContactMessage } from '../lib/contactForm';
import { apiBaseUrl } from './config';
import { ApiError, apiErrorFrom } from './errors';
import {
  ParseError,
  parseContactInfo,
  parseList,
  parseLocation,
  parseProject,
  parseService,
  parseSiteSettings,
  parseSocialLink,
} from './parsers';

/**
 * The public website API (`/api/public/website`, built in the ID-Indetails
 * backend). Every call is anonymous and read-only except the contact form.
 *
 * NOT CONNECTED YET: the site still reads its static data from `src/data`.
 * Switching over means calling these from the data sources
 * (`data/projectSource.ts`, `data/contactSource.ts`) and the pages that read
 * `data/site.ts` and `data/offices.ts`.
 */

async function request<T>(path: string, parse: (body: unknown) => T, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { Accept: 'application/json', ...init.headers } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'network_error', 'The server could not be reached.');
  }

  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw apiErrorFrom(response.status, body);
  try {
    return parse(body);
  } catch (error) {
    if (error instanceof ParseError) {
      console.error(`Unexpected reply from ${path}`, error);
      throw new ApiError(0, 'bad_response', 'The server sent something the site cannot read.');
    }
    throw error;
  }
}

const get = <T>(path: string, parse: (body: unknown) => T, signal?: AbortSignal) => request(path, parse, { signal });

/** Every published project: all go on the globe and the projects page; the strip shows those marked for it. */
export const getProjects = (signal?: AbortSignal): Promise<Project[]> =>
  get('/projects', (body) => parseList(body, parseProject, 'project'), signal);

/** One project, for a shared `/projects/<slug>` link that should show before the full list arrives. */
export const getProject = (slug: string, signal?: AbortSignal): Promise<Project> =>
  get(`/projects/${encodeURIComponent(slug)}`, parseProject, signal);

export const getServices = (signal?: AbortSignal): Promise<Service[]> =>
  get('/services', (body) => parseList(body, parseService, 'service'), signal);

export const getLocations = (signal?: AbortSignal): Promise<Office[]> =>
  get('/locations', (body) => parseList(body, parseLocation, 'location'), signal);

export const getContactInfo = (signal?: AbortSignal): Promise<ContactInfo> => get('/contact', parseContactInfo, signal);

export const getSocialLinks = (signal?: AbortSignal): Promise<SocialLink[]> =>
  get('/social-links', (body) => parseList(body, parseSocialLink, 'social link'), signal);

export const getSiteSettings = (signal?: AbortSignal): Promise<SiteSettings> => get('/settings', parseSiteSettings, signal);

/**
 * Sends the contact form (the API answers 202). `website` is the hidden
 * honeypot field: people leave it empty; the API quietly drops messages
 * where a bot filled it in. Validation errors come back as an ApiError with
 * `fieldErrors` keyed name/email/phone/message.
 */
export const postContactMessage = (message: ContactMessage, signal?: AbortSignal): Promise<void> =>
  request(
    '/contact-messages',
    () => undefined,
    { method: 'POST', body: JSON.stringify(message), headers: { 'Content-Type': 'application/json' }, signal },
  );
