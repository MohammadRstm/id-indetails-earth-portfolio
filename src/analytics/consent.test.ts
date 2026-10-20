import { describe, expect, it } from 'vitest';
import { CONSENT_KEPT_MS, readConsent, saveConsent, signalsNoTracking } from './consent';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
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

const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } } as unknown as Storage;

describe('consent', () => {
  it('has no answer until one is saved, then keeps it', () => {
    const storage = memoryStorage();
    expect(readConsent(storage)).toBeNull();
    saveConsent(storage, 'granted', 1_000);
    expect(readConsent(storage, 2_000)).toBe('granted');
    saveConsent(storage, 'denied', 3_000);
    expect(readConsent(storage, 4_000)).toBe('denied');
  });

  it('asks again after a year', () => {
    const storage = memoryStorage();
    saveConsent(storage, 'granted', 0);
    expect(readConsent(storage, CONSENT_KEPT_MS - 1)).toBe('granted');
    expect(readConsent(storage, CONSENT_KEPT_MS)).toBeNull();
  });

  it('ignores anything it did not write, and storage that is blocked or missing', () => {
    const storage = memoryStorage();
    storage.setItem('idi-analytics-consent', 'yes please');
    expect(readConsent(storage)).toBeNull();
    storage.setItem('idi-analytics-consent', JSON.stringify({ choice: 'maybe', at: 0 }));
    expect(readConsent(storage, 1)).toBeNull();
    expect(readConsent(blocked)).toBeNull();
    expect(() => saveConsent(blocked, 'granted')).not.toThrow();
    expect(readConsent(undefined)).toBeNull();
  });

  it('reads the browser saying "do not track me"', () => {
    expect(signalsNoTracking({ globalPrivacyControl: true } as unknown as Navigator)).toBe(true);
    expect(signalsNoTracking({} as Navigator)).toBe(false);
    expect(signalsNoTracking(undefined)).toBe(false);
  });
});
