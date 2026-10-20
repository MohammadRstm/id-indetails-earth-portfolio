/**
 * The visitor's answer to the cookie question, kept in this browser so it is
 * asked only once a year. Nothing else is stored. When storage is blocked
 * (some private windows) the answer holds for the visit and is asked again
 * next time.
 */
export type ConsentChoice = 'granted' | 'denied';

const STORAGE_KEY = 'idi-analytics-consent';
/** After a year the question is asked again, as consent guidance recommends. */
export const CONSENT_KEPT_MS = 365 * 24 * 60 * 60 * 1000;

interface StoredConsent {
  choice: ConsentChoice;
  /** When it was given, in milliseconds since 1970. */
  at: number;
}

/** This browser's storage, or none when it is blocked. */
export function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readConsent(storage: Storage | undefined, now = Date.now()): ConsentChoice | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<StoredConsent>;
    const known = stored.choice === 'granted' || stored.choice === 'denied';
    const fresh = typeof stored.at === 'number' && stored.at <= now && now - stored.at < CONSENT_KEPT_MS;
    return known && fresh ? (stored.choice as ConsentChoice) : null;
  } catch {
    return null;
  }
}

export function saveConsent(storage: Storage | undefined, choice: ConsentChoice, now = Date.now()): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ choice, at: now } satisfies StoredConsent));
  } catch {
    // Not kept: the visitor is asked again next time.
  }
}

/** Global Privacy Control: the browser already says "do not track me", so the site doesn't ask and doesn't collect. */
export const signalsNoTracking = (navigator: Navigator | undefined): boolean =>
  (navigator as (Navigator & { globalPrivacyControl?: boolean }) | undefined)?.globalPrivacyControl === true;
