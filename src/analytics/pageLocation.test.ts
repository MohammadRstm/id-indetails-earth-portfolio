import { describe, expect, it } from 'vitest';
import { analyticsLocation } from './pageLocation';

const origin = 'https://id-indetails.com';

describe('analyticsLocation', () => {
  it('is the page path on the site', () => {
    expect(analyticsLocation(origin, '/projects/alfama-lofts')).toBe('https://id-indetails.com/projects/alfama-lofts');
  });

  it('keeps the campaign tags of the landing address', () => {
    expect(analyticsLocation(origin, '/', '?utm_source=newsletter&utm_medium=email&utm_campaign=autumn&gclid=abc')).toBe(
      'https://id-indetails.com/?utm_source=newsletter&utm_medium=email&utm_campaign=autumn&gclid=abc',
    );
  });

  it('leaves out everything a visitor types or picks on the grid', () => {
    expect(analyticsLocation(origin, '/', '?q=rana%40example.com&type=villa&status=completed&page=2&utm_source=x')).toBe(
      'https://id-indetails.com/?utm_source=x',
    );
    expect(analyticsLocation(origin, '/', '?q=anything')).toBe('https://id-indetails.com/');
  });
});
