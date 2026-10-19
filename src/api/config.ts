const DEFAULT_API_BASE_URL = '/api/public/website';

/** The public website API's base URL, without a trailing slash. */
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

/**
 * Image paths come back root-relative to the API (`/api/public/website/files/42`).
 * On the site's own origin they work as they are; when the API is on another
 * origin they are resolved against it. Absolute URLs are left alone.
 */
export function resolveAssetUrl(path: string, baseUrl = apiBaseUrl): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith('//')) return path;
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(baseUrl) || !path.startsWith('/')) return path;
  return new URL(path, baseUrl).toString();
}
