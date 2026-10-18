import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../data/project';
import { GlobeStage } from '../globe/GlobeStage';
import { useMediaQuery, usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { groupByLocation } from '../lib/geo';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { MotionToggle } from './MotionToggle';
import { ProjectCaption } from './ProjectCaption';
import { ProjectDock } from './ProjectDock';
import { ProjectHeading, ProjectPage } from './ProjectPage';
import { ProjectStrip } from './ProjectStrip';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]') !== null;

interface ExplorerProps {
  projects: Project[];
  /** The project whose page is open, from the address bar; null on the globe overview. */
  openId: string | null;
  /** False while another page (Studio, Contact) is showing: the explorer stays mounted but hidden and idle. */
  active: boolean;
  onOpenProject: (id: string) => void;
  onCloseProject: () => void;
  onContact: () => void;
}

/**
 * The landing page and the project pages, without ever leaving the page: the
 * overview shows the globe beside a drifting strip of projects; opening one
 * slides the strip away, turns the globe to the place and moves in until
 * only its horizon remains above the project's page.
 */
export function Explorer({ projects, openId, active, onOpenProject, onCloseProject, onContact }: ExplorerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useMediaQuery('(max-width: 959px)');
  const groups = useMemo(() => groupByLocation(projects), [projects]);
  const [selectedId, setSelectedId] = useState(() => openId ?? projects[0].id);
  const [motionOn, setMotionOn] = useState(true);
  const frameRef = useRef<HTMLDivElement>(null);

  // Whatever project was open stays selected afterwards, so the strip comes back at the same card.
  const [lastOpenId, setLastOpenId] = useState(openId);
  if (openId !== lastOpenId) {
    setLastOpenId(openId);
    if (openId !== null) setSelectedId(openId);
  }

  const projectOpen = openId !== null;
  const currentId = openId ?? selectedId;
  const index = Math.max(0, projects.findIndex((project) => project.id === currentId));
  const project = projects[index];
  const group = groups.find((candidate) => candidate.projects.includes(project)) ?? groups[0];
  const at = (offset: number) => projects[(index + offset + projects.length) % projects.length];

  const step = useCallback(
    (direction: 1 | -1) => {
      if (projectOpen) {
        const from = projects.findIndex((item) => item.id === currentId);
        onOpenProject(projects[(from + direction + projects.length) % projects.length].id);
        return;
      }
      setSelectedId((current) => {
        const from = projects.findIndex((item) => item.id === current);
        return projects[(from + direction + projects.length) % projects.length].id;
      });
    },
    [projects, projectOpen, currentId, onOpenProject],
  );

  const openProject = useCallback(
    (id: string) => {
      setSelectedId(id);
      onOpenProject(id);
    },
    [onOpenProject],
  );

  const selectGroup = useCallback(
    (groupId: string) => {
      const target = groups.find((candidate) => candidate.id === groupId);
      if (target) openProject(target.projects[0].id);
    },
    [groups, openProject],
  );

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Escape' && projectOpen) {
        onCloseProject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, step, projectOpen, onCloseProject]);

  // Warm the cache with the current project's opening photo, so its page appears complete.
  useEffect(() => {
    const image = new Image();
    image.src = project.hero.src;
  }, [project]);

  return (
    <main className="explorer" id={active ? 'content' : undefined} hidden={!active} data-view={projectOpen ? 'project' : 'overview'}>
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
            running={active && !projectOpen}
            reducedMotion={reducedMotion}
            onActiveChange={(next) => setSelectedId(projects[next].id)}
            onOpen={(next) => openProject(projects[next].id)}
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
          <ProjectDock key={project.id} project={project} reducedMotion={reducedMotion} />
        )}
        {projectOpen && <ProjectHeading project={project} onBack={onCloseProject} />}
      </div>

      {projectOpen && (
        <ProjectPage project={project} previous={at(-1)} next={at(1)} onOpen={openProject} onContact={onContact} />
      )}

      <p className="visually-hidden" aria-live="polite">
        {projectOpen
          ? `${project.title}, ${project.location.city}. Project page open.`
          : `${project.title}, ${project.location.city}. Project ${index + 1} of ${projects.length}.`}
      </p>
    </main>
  );
}
