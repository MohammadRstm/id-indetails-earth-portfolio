import type { ConsentChoice } from '../analytics/consent';
import type { Page } from '../hooks/useSiteRoute';
import { PageLink } from './PageLink';

interface ConsentBannerProps {
  onAnswer: (choice: ConsentChoice) => void;
  onNavigate: (page: Page) => void;
}

/**
 * Asks once whether the site may count visits with Google Analytics. Both
 * answers weigh the same, the page stays usable behind it, and the answer is
 * kept, so the question comes back only after a year or from "Cookie
 * settings" in the footer.
 */
export function ConsentBanner({ onAnswer, onNavigate }: ConsentBannerProps) {
  return (
    <section className="consent" aria-labelledby="consent-title">
      <h2 className="consent__title" id="consent-title">
        Cookies
      </h2>
      <p className="consent__text">
        May we use Google Analytics cookies to count visits and see which pages are useful? Nothing is used for advertising, and you
        can change your mind at any time from “Cookie settings” at the bottom of the page.{' '}
        <PageLink page="privacy" onNavigate={onNavigate}>
          Privacy notice
        </PageLink>
      </p>
      <div className="consent__actions">
        <button type="button" className="button button--outline" onClick={() => onAnswer('denied')}>
          Decline
        </button>
        <button type="button" className="button" onClick={() => onAnswer('granted')}>
          Accept
        </button>
      </div>
    </section>
  );
}
