import type { Page } from '../hooks/useSiteRoute';
import { ArrowRightIcon } from './icons';
import { PageLink } from './PageLink';

/**
 * What every address but Contact and Privacy shows while the company has put
 * the website under construction (the switch in the app's Website area).
 */
export function UnderConstruction({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="page construction" id="content">
      <div className="construction__sign" aria-hidden="true" />
      <h1 className="page__title construction__title">Under construction</h1>
      <p className="page__lead">Our new website is on its way. In the meantime, we would love to hear about your project.</p>
      <PageLink page="contact" className="text-action page__action" onNavigate={onNavigate}>
        Contact us
        <ArrowRightIcon />
      </PageLink>
    </main>
  );
}
