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
 *
 * The growth animates only `transform`, which the browser runs on the GPU
 * compositor: it stays smooth while the page is busy setting up the project
 * view, where animating the size directly would stall and then jump.
 */
export function ProjectDock({ project, origin, reducedMotion }: ProjectDockProps) {
  const dockRef = useRef<HTMLElement>(null);

  // The parent remounts the dock for each project, so this runs as each photo first appears.
  useLayoutEffect(() => {
    const dock = dockRef.current;
    if (!dock || !dock.offsetParent || reducedMotion) return;
    if (!origin) {
      const fade = dock.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_MS, easing: 'ease-out' });
      return () => fade.cancel();
    }
    // Start as a copy of the card: scaled down uniformly (so the photo is never stretched) to cover it, centred on it.
    const final = dock.getBoundingClientRect();
    const scale = Math.max(origin.width / final.width, origin.height / final.height);
    const x = origin.left + origin.width / 2 - (final.left + (final.width * scale) / 2);
    const y = origin.top + origin.height / 2 - (final.top + (final.height * scale) / 2);
    // Eases out: it leaves the card at once and settles gently, rather than lingering at card size first.
    const grow = dock.animate([{ transform: `translate(${x}px, ${y}px) scale(${scale})` }, { transform: 'none' }], {
      duration: GROW_MS,
      easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
    });
    // Cancelling on cleanup matters: a re-run (React runs effects twice in development) must measure the photo
    // in its final place, not part-way through this animation, or it starts a do-nothing animation over this one.
    return () => grow.cancel();
  }, [origin, reducedMotion]);

  return (
    // The card's small photo sits underneath, already loaded, so the dock is never blank while the large one decodes.
    <figure ref={dockRef} className="dock" style={{ backgroundImage: `url(${project.thumbnail})` }}>
      <img src={project.hero.src} alt={project.hero.alt} decoding="async" />
    </figure>
  );
}
