import { describe, expect, it } from 'vitest';
import { formatStartDate } from './format';

describe('formatStartDate', () => {
  it('formats a year and month', () => {
    expect(formatStartDate('2024-03')).toBe('March 2024');
    expect(formatStartDate('2022-11')).toBe('November 2022');
  });

  it('ignores the day of a full date', () => {
    expect(formatStartDate('2025-08-17')).toBe('August 2025');
  });

  it('does not shift the month with the local time zone', () => {
    expect(formatStartDate('2024-01-01')).toBe('January 2024');
    expect(formatStartDate('2024-12-31')).toBe('December 2024');
  });

  it.each(['2024-13', '2024-00', '2024-02-31', '2023-02-29', '2024-04-31'])('returns null for an impossible date %j', (value) => {
    expect(formatStartDate(value)).toBeNull();
  });

  it('accepts a real leap day', () => {
    expect(formatStartDate('2024-02-29')).toBe('February 2024');
  });

  it.each(['', 'March 2024', '2024', '2024-3', '24-03', '2024/03', '2024-03-1', '2024-03-15T00:00:00Z'])(
    'returns null for malformed input %j',
    (value) => {
      expect(formatStartDate(value)).toBeNull();
    },
  );
});
