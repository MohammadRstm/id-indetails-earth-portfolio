import { browserStorage, readConsent, saveConsent, signalsNoTracking, type ConsentChoice } from './consent';
import { analyticsLocation } from './pageLocation';

/**
 * Google Analytics 4. Google's tag is loaded only in a build given a
 * measurement ID, and only once the visitor accepts. The site sends its own
 * page views, one per page, and a few business events; never anything a
 * visitor types, nor any contact detail. Advertising features stay off.
 */

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();

/** False in development, CI and preview builds, which have no ID: nothing is loaded and nobody is asked. */
export const analyticsConfigured = /^G-[A-Z0-9]+$/.test(MEASUREMENT_ID);

/** The events the site sends, with every parameter they may carry. */
export interface AnalyticsEvents {
  /** A contact message the API accepted (a key event). */
  generate_lead: { lead_source: 'contact_form' };
  /** The studio's email link (a key event). */
  email_click: { link_location: 'contact_page' | 'contact_form' };
  /** A studio's phone number (a key event). */
  phone_click: { link_location: 'contact_details' | 'office'; office_city: string };
  /** A "Contact us" button, which leads to the contact page. */
  contact_cta_click: { cta_location: 'project_page' | 'studio_page'; project_slug?: string };
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// What the visit landed with, read before the grid tidies the address, so its campaign tags count.
const landingSearch = typeof window === 'undefined' ? '' : window.location.search;

let loaded = false;
let granted = false;
let lastPath: string | null = null;
let currentPage: { path: string; title: string } | null = null;
let sentFirstView = false;

const gtag: (...args: unknown[]) => void = function () {
  // Google's tag reads `arguments` objects from the data layer and ignores arrays, so rest parameters won't do.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
};

function loadTag() {
  loaded = true;
  window.dataLayer = window.dataLayer ?? [];
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

function sendPageView(page: { path: string; title: string }) {
  gtag('event', 'page_view', {
    page_location: analyticsLocation(window.location.origin, page.path, sentFirstView ? '' : landingSearch),
    page_title: page.title,
  });
  sentFirstView = true;
}

function grant() {
  if (granted) return;
  granted = true;
  if (loaded) gtag('consent', 'update', { analytics_storage: 'granted' });
  else loadTag();
  if (currentPage) sendPageView(currentPage);
}

function deny() {
  if (!granted) return;
  granted = false;
  gtag('consent', 'update', { analytics_storage: 'denied' });
  removeAnalyticsCookies();
}

/** Whether to show the cookie question: there is something to ask about, and no answer yet. */
export function consentNeeded(): boolean {
  return analyticsConfigured && readConsent(browserStorage()) === null && !signalsNoTracking(window.navigator);
}

/** At start-up: collects at once when the visitor accepted before, and the browser doesn't ask not to be tracked. */
export function restoreConsent() {
  if (analyticsConfigured && !signalsNoTracking(window.navigator) && readConsent(browserStorage()) === 'granted') grant();
}

/** The visitor's answer: kept for a year, and applied at once (declining removes the cookies already set). */
export function chooseConsent(choice: ConsentChoice) {
  if (!analyticsConfigured) return;
  saveConsent(browserStorage(), choice);
  if (choice === 'granted') grant();
  else deny();
}

/** A page view per page: the same path again (a search typed on the grid, a skip link) is the same page. */
export function pageView(path: string, title: string) {
  if (path === lastPath) return;
  lastPath = path;
  currentPage = { path, title };
  if (granted) sendPageView(currentPage);
}

export function track<K extends keyof AnalyticsEvents>(name: K, params: AnalyticsEvents[K]) {
  if (granted) gtag('event', name, params);
}

/** Google Analytics' own cookies (`_ga`, `_ga_<id>`), set on this site's domain or a parent of it. */
function removeAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  const labels = window.location.hostname.split('.');
  const domains = labels.map((_, index) => labels.slice(index).join('.')).filter((domain) => domain.includes('.'));
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
  }
}
