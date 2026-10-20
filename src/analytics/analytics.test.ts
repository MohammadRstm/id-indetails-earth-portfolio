import { afterEach, describe, expect, it, vi } from 'vitest';

type Analytics = typeof import('./analytics');

interface FakeBrowser {
  window: { dataLayer?: unknown[]; location: { search: string; origin: string; hostname: string }; navigator: object; localStorage: Storage };
  scripts: { src?: string; async?: boolean }[];
  cookieWrites: string[];
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial));
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

/** A browser the analytics module can run in: its data layer, the scripts it adds and the cookies it writes. */
async function load(
  options: { id?: string; search?: string; stored?: Record<string, string>; globalPrivacyControl?: boolean } = {},
): Promise<{ analytics: Analytics; browser: FakeBrowser }> {
  vi.resetModules();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', options.id ?? 'G-TEST123');
  const browser: FakeBrowser = {
    window: {
      location: { search: options.search ?? '', origin: 'https://id-indetails.com', hostname: 'www.id-indetails.com' },
      navigator: options.globalPrivacyControl ? { globalPrivacyControl: true } : {},
      localStorage: memoryStorage(options.stored),
    },
    scripts: [],
    cookieWrites: [],
  };
  vi.stubGlobal('window', browser.window);
  vi.stubGlobal('document', {
    get cookie() {
      return '_ga=GA1.1.123; _ga_TEST123=GS1.1.456; other=1';
    },
    set cookie(value: string) {
      browser.cookieWrites.push(value);
    },
    createElement: () => {
      const script = {};
      browser.scripts.push(script);
      return script;
    },
    head: { appendChild: () => undefined },
  });
  return { analytics: await import('./analytics'), browser };
}

/** What was pushed to the data layer, each `arguments` object as a list. */
const pushed = (browser: FakeBrowser) => (browser.window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
const events = (browser: FakeBrowser) => pushed(browser).filter((entry) => entry[0] === 'event');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('analytics', () => {
  it('without a measurement ID asks nothing and loads nothing', async () => {
    const { analytics, browser } = await load({ id: '' });
    expect(analytics.analyticsConfigured).toBe(false);
    expect(analytics.consentNeeded()).toBe(false);
    analytics.chooseConsent('granted');
    analytics.pageView('/', 'Home');
    expect(browser.scripts).toEqual([]);
    expect(browser.window.dataLayer).toBeUndefined();
  });

  it('loads nothing and sends nothing before the visitor accepts', async () => {
    const { analytics, browser } = await load();
    expect(analytics.consentNeeded()).toBe(true);
    analytics.pageView('/', 'Home');
    analytics.track('email_click', { link_location: 'contact_page' });
    expect(browser.scripts).toEqual([]);
    expect(browser.window.dataLayer).toBeUndefined();
  });

  it('on Accept loads Google tag with advertising off and counts the page being viewed, with its campaign tags only', async () => {
    const { analytics, browser } = await load({ search: '?utm_source=newsletter&q=what%20they%20typed' });
    analytics.pageView('/', 'ID-Indetails · Architecture');
    analytics.chooseConsent('granted');

    expect(browser.scripts).toEqual([{ async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123' }]);
    const [consent, js, config] = pushed(browser);
    expect(consent).toEqual(['consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }]);
    expect(js[0]).toBe('js');
    expect(config).toEqual(['config', 'G-TEST123', { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }]);
    expect(events(browser)).toEqual([
      ['event', 'page_view', { page_location: 'https://id-indetails.com/?utm_source=newsletter', page_title: 'ID-Indetails · Architecture' }],
    ]);
    expect(analytics.consentNeeded()).toBe(false);
  });

  it('counts one page view per page, and only the events it is given', async () => {
    const { analytics, browser } = await load({ search: '?utm_source=newsletter' });
    analytics.chooseConsent('granted');
    analytics.pageView('/', 'Home');
    analytics.pageView('/', 'Home');
    analytics.pageView('/contact', 'Contact · ID-Indetails');
    analytics.track('phone_click', { link_location: 'office', office_city: 'Beirut' });

    expect(events(browser)).toEqual([
      ['event', 'page_view', { page_location: 'https://id-indetails.com/?utm_source=newsletter', page_title: 'Home' }],
      ['event', 'page_view', { page_location: 'https://id-indetails.com/contact', page_title: 'Contact · ID-Indetails' }],
      ['event', 'phone_click', { link_location: 'office', office_city: 'Beirut' }],
    ]);
  });

  it('on a change of mind stops sending and removes the analytics cookies', async () => {
    const { analytics, browser } = await load();
    analytics.chooseConsent('granted');
    analytics.chooseConsent('denied');
    analytics.track('generate_lead', { lead_source: 'contact_form' });

    expect(pushed(browser).at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(events(browser)).toEqual([]);
    expect(browser.cookieWrites).toContain('_ga=; Max-Age=0; path=/; domain=.id-indetails.com');
    expect(browser.cookieWrites).toContain('_ga_TEST123=; Max-Age=0; path=/; domain=.id-indetails.com');
    expect(browser.cookieWrites.some((write) => write.startsWith('other='))).toBe(false);
  });

  it('remembers an earlier Accept without asking again', async () => {
    const stored = { 'idi-analytics-consent': JSON.stringify({ choice: 'granted', at: Date.now() }) };
    const { analytics, browser } = await load({ stored });
    expect(analytics.consentNeeded()).toBe(false);
    analytics.restoreConsent();
    expect(browser.scripts).toHaveLength(1);
  });

  it('takes Global Privacy Control as a no: nothing is asked or loaded', async () => {
    const stored = { 'idi-analytics-consent': JSON.stringify({ choice: 'granted', at: Date.now() }) };
    const { analytics, browser } = await load({ stored, globalPrivacyControl: true });
    expect(analytics.consentNeeded()).toBe(false);
    analytics.restoreConsent();
    expect(browser.scripts).toEqual([]);
  });
});
