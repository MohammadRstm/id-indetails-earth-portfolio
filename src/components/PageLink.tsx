import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { pathFor, type Page } from '../hooks/useSiteRoute';

interface PageLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

/**
 * A real link to one of the site's pages (so it can open in a new tab), that
 * moves there in place on a plain click instead of reloading.
 */
export function PageLink({ page, onNavigate, children, ...rest }: PageLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(page);
  };

  return (
    <a href={pathFor({ page })} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
