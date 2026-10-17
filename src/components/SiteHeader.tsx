import type { MouseEvent } from 'react';
import { EmblemIcon } from './icons';
import { ScrollLink } from './ScrollLink';

/** `onHome` returns to the globe from a project page; the links stay real links for new tabs. */
export function SiteHeader({ onHome }: { onHome: () => void }) {
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onHome();
  };

  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="ID-Indetails, all projects" onClick={goHome}>
        <EmblemIcon className="wordmark__emblem" />
        <span className="wordmark__name">ID-Indetails</span>
      </a>
      <nav className="site-nav" aria-label="Site">
        <a className="site-nav__link" href="/" onClick={goHome}>
          Projects
        </a>
        <ScrollLink className="site-nav__link" to="about">
          Studio
        </ScrollLink>
      </nav>
    </header>
  );
}
