import { useEffect, useRef } from 'react';
import type { LocationGroup } from '../lib/geo';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ProjectNavigatorProps {
  groups: LocationGroup[];
  activeGroupId: string;
  position: number;
  total: number;
  onSelectGroup: (groupId: string) => void;
  onStep: (direction: 1 | -1) => void;
}

export function ProjectNavigator({ groups, activeGroupId, position, total, onSelectGroup, onStep }: ProjectNavigatorProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the active place in view when the list scrolls sideways (narrow screens).
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const left = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' });
  }, [activeGroupId]);

  return (
    <div className="navigator">
      <div className="navigator__steps">
        <button type="button" className="icon-button" aria-label="Previous project" onClick={() => onStep(-1)}>
          <ChevronLeftIcon />
        </button>
        <p className="navigator__position">
          Project <span className="navigator__number">{position}</span> of {total}
        </p>
        <button type="button" className="icon-button" aria-label="Next project" onClick={() => onStep(1)}>
          <ChevronRightIcon />
        </button>
      </div>

      <nav className="navigator__places" aria-label="Project locations">
        <ul ref={listRef}>
          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                className="place"
                aria-current={group.id === activeGroupId ? 'true' : undefined}
                onClick={() => onSelectGroup(group.id)}
              >
                {group.city}
                {group.projects.length > 1 && (
                  <span className="place__count">
                    <span className="visually-hidden">, </span>
                    {group.projects.length}
                    <span className="visually-hidden"> projects</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
