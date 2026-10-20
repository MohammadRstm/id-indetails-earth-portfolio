/** Campaign tags Google Analytics reads from the address a visit lands on: utm_source and the rest, and Google Ads click ids. */
const CAMPAIGN_PARAM = /^(utm_[a-z_]+|gclid|gbraid|wbraid)$/;

/**
 * The page address sent to Google Analytics: the page's path, plus the
 * campaign tags of the address the visit landed on. The rest of the query
 * (the grid's search text and filters) is left out, so nothing a visitor
 * types reaches Google.
 */
export function analyticsLocation(origin: string, path: string, landingSearch = ''): string {
  const kept = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(landingSearch)) {
    if (CAMPAIGN_PARAM.test(key)) kept.append(key, value);
  }
  const query = kept.toString();
  return `${origin}${path}${query ? `?${query}` : ''}`;
}
