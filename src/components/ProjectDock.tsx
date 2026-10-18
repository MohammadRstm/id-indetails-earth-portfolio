import { useLayoutEffect, useRef } from 'react';
import type { Project } from '../data/project';

const GROW_MS = 900;
const FADE_MS = 450;

interface ProjectDockProps {
  project: Project;
  /** Where the photo was on screen when the project was chosen (its card in the strip), if anywhere. */
  origin: DOMRect | null;
  reducedMotion: boolean;
}

/**
 * The project's photograph, held to the right of the globe's close-up. When
 * the project was picked from the strip, the photo grows out of its card into
 * place; otherwise it fades in.
 */
export function ProjectDock({ project, origin, reducedMotion }: ProjectDockProps) {
  const dockRef = useRef<HTMLElement>(null);

  // The parent remounts the dock for each project, so this runs as each photo first appears.
  useLayoutEffect(() => {
    const dock = dockRef.current;
    const container = dock?.offsetParent;
    if (!dock || !(container instanceof HTMLElement) || reducedMotion) return;
    if (!origin) {
      dock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' });
      return;
    }
    const box = container.getBoundingClientRect();
    const from = {
      left: `${origin.left - box.left}px`,
      top: `${origin.top - box.top}px`,
      width: `${origin.width}px`,
      height: `${origin.height}px`,
    };
    const to = {
      left: `${dock.offsetLeft}px`,
      top: `${dock.offsetTop}px`,
      width: `${dock.offsetWidth}px`,
      height: `${dock.offsetHeight}px`,
    };
    dock.animate([from, to], { duration: GROW_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  }, [origin, reducedMotion]);

  return (
    <figure ref={dockRef} className="dock">
      <img src={project.hero.src} alt={project.hero.alt} decoding="async" />
    </figure>
  );
}
