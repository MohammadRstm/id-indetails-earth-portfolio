import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../data/project';
import { GlobeStage } from '../globe/GlobeStage';
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { useProjectRoute } from '../hooks/useProjectRoute';
import { groupByLocation } from '../lib/geo';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { MotionToggle } from './MotionToggle';
import { ProjectCaption } from './ProjectCaption';
import { ProjectDock } from './ProjectDock';
import { ProjectHeading, ProjectPage } from './ProjectPage';
import { ProjectStrip } from './ProjectStrip';

const SITE_TITLE = 'ID-Indetails';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]') !== null;

interface ExplorerProps {
  projects: Project[];
  /** Registers the explorer's way back to the overview, used by the site header. */
  onHomeChange: (goHome: (() => void) | null) => void;
}

/**
 * The landing page and the project pages, without ever leaving the page: the
 * overview shows the globe beside a drifting strip of projects; opening one
 * slides the strip away, turns the globe to the place and moves in until
 * only its horizon remains above the project's page.
 */
export function Explorer({ projects, onHomeChange }: ExplorerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useMediaQuery('(max-width: 959px)');
  const groups = useMemo(() => groupByLocation(projects), [projects]);
  const isKnown = useCallback((id: string) => projects.some((project) => project.id === id), [projects]);
  const route = useProjectRoute(isKnown);
  const [selectedId, setSelectedId] = useState(() => route.openId ?? projects[0].id);
  const [motionOn, setMotionOn] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  // Whatever project was open stays selected afterwards, so the strip comes back at the same card.
  const [lastOpenId, setLastOpenId] = useState(route.openId);
  if (route.openId !== lastOpenId) {
    setLastOpenId(route.openId);
    if (route.openId !== null) setSelectedId(route.openId);
  }

  const projectOpen = route.openId !== null;
  const currentId = route.openId ?? selectedId;
  const index = Math.max(0, projects.findIndex((project) => project.id === currentId));
  const project = projects[index];
  const group = groups.find((candidate) => candidate.projects.includes(project)) ?? groups[0];
  const at = (offset: number) => projects[(index + offset + projects.length) % projects.length];

  const { open, close } = route;

  const step = useCallback(
    (direction: 1 | -1) => {
      if (projectOpen) {
        const from = projects.findIndex((item) => item.id === currentId);
        open(projects[(from + direction + projects.length) % projects.length].id);
        return;
      }
      setSelectedId((current) => {
        const from = projects.findIndex((item) => item.id === current);
        return projects[(from + direction + projects.length) % projects.length].id;
      });
    },
    [projects, projectOpen, currentId, open],
  );

  // Where the chosen project's photo was on screen, so the photo can grow from there into its place on the project page.
  const [dockOrigin, setDockOrigin] = useState<{ id: string; rect: DOMRect } | null>(null);

  const openProject = useCallback(
    (id: string, origin?: DOMRect) => {
      if (!projectOpen) {
        const card = origin ?? document.querySelector('.explorer__strip .strip__card[data-current="true"]')?.getBoundingClientRect();
        setDockOrigin(card ? { id, rect: card } : null);
      }
      setSelectedId(id);
      open(id);
    },
    [open, projectOpen],
  );

  const selectGroup = useCallback(
    (groupId: string) => {
      const target = groups.find((candidate) => candidate.id === groupId);
      if (target) openProject(target.projects[0].id);
    },
    [groups, openProject],
  );

  useEffect(() => {
    onHomeChange(close);
    return () => onHomeChange(null);
  }, [close, onHomeChange]);

  // Each view starts at the top: the globe's horizon when a project opens, the globe itself on the way back.
  // From far down a long page, a smooth scroll would only sweep past empty space, so it jumps instead.
  useEffect(() => {
    const near = window.scrollY < window.innerHeight * 1.5;
    window.scrollTo({ top: 0, behavior: near && !reducedMotion ? 'smooth' : 'auto' });
  }, [route.openId, reducedMotion]);

  useEffect(() => {
    document.title = projectOpen ? `${project.title} · ${SITE_TITLE}` : `${SITE_TITLE} · Architecture`;
  }, [projectOpen, project]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Escape' && projectOpen) {
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, projectOpen, close]);

  // Warm the cache with the current project's opening photo, so its page appears complete.
  useEffect(() => {
    const image = new Image();
    image.src = project.hero.src;
  }, [project]);

  return (
    <main className="explorer" id="top" data-view={projectOpen ? 'project' : 'overview'}>
      <h1 className="visually-hidden">ID-Indetails architecture projects</h1>
      <div className="explorer__stage">
        <GlobeStage
          groups={groups}
          activeGroupId={group.id}
          activeProject={project}
          closeUp={projectOpen}
          interactive={!projectOpen}
          animate={motionOn && !reducedMotion}
          reducedMotion={reducedMotion}
          frameRef={frameRef}
          onSelectGroup={selectGroup}
        />
      </div>

      <div className="explorer__hero">
        <div className="explorer__frame" ref={frameRef} aria-hidden="true" />

        <div className="explorer__strip" inert={projectOpen}>
          <ProjectStrip
            projects={projects}
            activeIndex={index}
            axis={narrow ? 'x' : 'y'}
            drifting={motionOn && !reducedMotion}
            running={!projectOpen}
            reducedMotion={reducedMotion}
            onActiveChange={(next) => setSelectedId(projects[next].id)}
            onOpen={(next, rect) => openProject(projects[next].id, rect)}
          />
        </div>

        <section className="showcase" id="project-controls" tabIndex={-1} aria-label="Projects" inert={projectOpen}>
          <ProjectCaption projects={projects} project={project} onOpen={openProject} />
          <div className="showcase__controls">
            <button type="button" className="icon-button" aria-label="Previous project" onClick={() => step(-1)}>
              <ChevronLeftIcon />
            </button>
            <button type="button" className="icon-button" aria-label="Next project" onClick={() => step(1)}>
              <ChevronRightIcon />
            </button>
            {!reducedMotion && <MotionToggle playing={motionOn} onToggle={() => setMotionOn(!motionOn)} />}
          </div>
        </section>

        {projectOpen && (
          <ProjectDock
            key={project.id}
            project={project}
            origin={dockOrigin?.id === project.id ? dockOrigin.rect : null}
            reducedMotion={reducedMotion}
          />
        )}
        {projectOpen && <ProjectHeading project={project} onBack={close} />}
      </div>

      {projectOpen && <ProjectPage project={project} previous={at(-1)} next={at(1)} onOpen={openProject} />}

      <p className="visually-hidden" aria-live="polite">
        {projectOpen
          ? `${project.title}, ${project.location.city}. Project page open.`
          : `${project.title}, ${project.location.city}. Project ${index + 1} of ${projects.length}.`}
      </p>
    </main>
  );
}
