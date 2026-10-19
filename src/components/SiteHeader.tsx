import type { Page } from '../hooks/useSiteRoute';
import { LogoMark } from './icons';
import { PageLink } from './PageLink';

const NAV: { page: Page; label: string }[] = [
  { page: 'studio', label: 'Studio' },
  { page: 'contact', label: 'Contact' },
];

interface SiteHeaderProps {
  /** The page in view; the globe and the project pages count as none of them. */
  current: Page;
  onNavigate: (page: Page) => void;
}

export function SiteHeader({ current, onNavigate }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <PageLink page="home" className="wordmark" onNavigate={onNavigate} aria-label="ID-Indetails, all projects">
        <LogoMark className="wordmark__logo" />
        <span className="wordmark__name">ID-Indetails</span>
      </PageLink>
      <nav className="site-nav" aria-label="Site">
        {NAV.map(({ page, label }) => (
          <PageLink
            key={page}
            page={page}
            className="site-nav__link"
            onNavigate={onNavigate}
            aria-current={current === page ? 'page' : undefined}
          >
            {label}
          </PageLink>
        ))}
      </nav>
    </header>
  );
}
