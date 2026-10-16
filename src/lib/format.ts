const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Formats `YYYY-MM` or `YYYY-MM-DD` as "March 2024". Returns null for malformed input. */
export function formatStartDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls invalid parts over (month 13, 31 February); reject those instead.
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return valid ? monthYear.format(date) : null;
}
