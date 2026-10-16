const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Formats `YYYY-MM` or `YYYY-MM-DD` as "March 2024". Returns null for malformed input. */
export function formatStartDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, day ? Number(day) : 1));
  return Number.isNaN(date.getTime()) ? null : monthYear.format(date);
}
