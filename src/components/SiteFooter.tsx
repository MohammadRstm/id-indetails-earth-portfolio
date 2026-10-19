import { socialLinks } from '../data/site';
import type { Page } from '../hooks/useSiteRoute';
import { LogoMark } from './icons';
import { PageLink } from './PageLink';

export function SiteFooter({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__brand">
          <LogoMark className="wordmark__logo" />
          <span className="wordmark__name">ID-Indetails</span>
        </div>
        <nav aria-label="Social media">
          <ul className="site-footer__social">
            {socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
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
        <p>Country outlines from Natural Earth, in the public domain.</p>
      </div>
    </footer>
  );
}
