import type { Page } from '../hooks/useSiteRoute';
import { ArrowRightIcon } from './icons';
import { PageLink } from './PageLink';

/**
 * Shown at a project address that matches no project. A project's address
 * comes from its name, so an old link to a renamed project ends up here.
 */
export function ProjectNotFound({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Projects</p>
        <h1 className="page__title">Project not found</h1>
        <p className="page__lead">This project may have been renamed or removed. All of our work is on the projects page.</p>
      </header>
      <PageLink page="projects" className="text-action page__action" onNavigate={onNavigate}>
        See all projects
        <ArrowRightIcon />
      </PageLink>
    </main>
  );
}
