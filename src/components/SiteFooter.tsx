import type { SocialLink } from '../data/site';
import type { Page } from '../hooks/useSiteRoute';
import { LogoMark } from './icons';
import { PageLink } from './PageLink';

interface SiteFooterProps {
  /** From the API; the social links are left out while there are none. */
  socialLinks: SocialLink[];
  onNavigate: (page: Page) => void;
  /** Asks the cookie question again; absent when the site uses no analytics. */
  onCookieSettings?: () => void;
}

export function SiteFooter({ socialLinks, onNavigate, onCookieSettings }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <LogoMark className="wordmark__logo" />
          <span className="wordmark__name">ID-Indetails</span>
        </div>
        {socialLinks.length > 0 && (
          <nav aria-label="Social media">
            <ul className="site-footer__social">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <nav aria-label="Footer">
          <ul className="site-footer__nav">
            <li>
              <PageLink page="studio" onNavigate={onNavigate}>
                Studio
              </PageLink>
            </li>
            <li>
              <PageLink page="contact" onNavigate={onNavigate}>
                Contact
              </PageLink>
            </li>
          </ul>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} ID-Indetails</p>
        <ul className="site-footer__legal">
          <li>
            <PageLink page="privacy" onNavigate={onNavigate}>
              Privacy
            </PageLink>
          </li>
          {onCookieSettings && (
            <li>
              <button type="button" onClick={onCookieSettings}>
                Cookie settings
              </button>
            </li>
          )}
        </ul>
        <p>Country outlines from Natural Earth, in the public domain.</p>
      </div>
    </footer>
  );
}
