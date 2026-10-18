import type { Page } from '../hooks/useSiteRoute';
import { EmblemIcon } from './icons';
import { PageLink } from './PageLink';

const NAV: { page: Page; label: string }[] = [
  { page: 'home', label: 'Projects' },
  { page: 'studio', label: 'Studio' },
  { page: 'contact', label: 'Contact' },
];

interface SiteHeaderProps {
  /** The page in view; a project page counts as Projects. */
  current: Page;
  onNavigate: (page: Page) => void;
}

export function SiteHeader({ current, onNavigate }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <PageLink page="home" className="wordmark" onNavigate={onNavigate} aria-label="ID-Indetails, all projects">
        <EmblemIcon className="wordmark__emblem" />
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
