import type { ReactNode } from 'react';

interface ScrollLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

/**
 * An in-page link that scrolls without adding `#fragment` history entries,
 * which would otherwise sit between a project and the globe in the back stack.
 */
export function ScrollLink({ to, className, children }: ScrollLinkProps) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(event) => {
        const target = document.getElementById(to);
        if (!target) return;
        event.preventDefault();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }}
    >
      {children}
    </a>
  );
}
