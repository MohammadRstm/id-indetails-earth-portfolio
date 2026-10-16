import { EmblemIcon } from './icons';

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="ID-Indetails, back to the globe">
        <EmblemIcon className="wordmark__emblem" />
        <span className="wordmark__name">ID-Indetails</span>
      </a>
      <nav className="site-nav" aria-label="Site">
        <a className="site-nav__link" href="#about">
          About the studio
        </a>
      </nav>
    </header>
  );
}
