import { describe, expect, it } from 'vitest';
import { hasExactPosition, placeName } from './project';

const withCity = { city: 'Beirut', country: 'Lebanon', countryCode: 'LB', lat: 33.89, lng: 35.5, approximate: false };
const countryOnly = { city: null, country: 'Lebanon', countryCode: 'LB', lat: 34.1, lng: 35.9, approximate: true };

describe('placeName', () => {
  it('names the city and the country', () => {
    expect(placeName(withCity)).toBe('Beirut, Lebanon');
  });

  it('names only the country when no city is given', () => {
    expect(placeName(countryOnly)).toBe('Lebanon');
  });
});

describe('hasExactPosition', () => {
  it('treats typed-in coordinates as the project’s own, and a point the API picked as not', () => {
    expect(hasExactPosition(withCity)).toBe(true);
    expect(hasExactPosition(countryOnly)).toBe(false);
    // A city without typed coordinates also gets a picked point.
    expect(hasExactPosition({ ...withCity, approximate: true })).toBe(false);
  });
});
