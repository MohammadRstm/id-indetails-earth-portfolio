import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../data/project';
import { GlobeStage } from '../globe/GlobeStage';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { groupByLocation } from '../lib/geo';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { ProjectNavigator } from './ProjectNavigator';
import { ProjectPanel } from './ProjectPanel';
import { RotationToggle } from './RotationToggle';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]') !== null;

/** The globe, the selected project and the controls that move between projects. */
export function Explorer({ projects }: { projects: Project[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const groups = useMemo(() => groupByLocation(projects), [projects]);
  const [selectedId, setSelectedId] = useState(() => (projects.find((project) => project.featured) ?? projects[0]).id);
  // null until the visitor chooses; then their choice wins over the motion preference.
  const [rotationChoice, setRotationChoice] = useState<boolean | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const autoRotate = rotationChoice ?? !reducedMotion;
  const index = Math.max(0, projects.findIndex((project) => project.id === selectedId));
  const project = projects[index];
  const group = groups.find((candidate) => candidate.projects.includes(project)) ?? groups[0];

  const step = useCallback(
    (direction: 1 | -1) => {
      setSelectedId((current) => {
        const at = projects.findIndex((item) => item.id === current);
        return projects[(at + direction + projects.length) % projects.length].id;
      });
    },
    [projects],
  );

  const selectGroup = useCallback(
    (groupId: string) => {
      const target = groups.find((candidate) => candidate.id === groupId);
      if (!target) return;
      setSelectedId((current) => {
        const at = target.projects.findIndex((item) => item.id === current);
        // Selecting the place you are already on moves to its next project.
        return target.projects[at === -1 ? 0 : (at + 1) % target.projects.length].id;
      });
    },
    [groups],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (detailsOpen || event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        step(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailsOpen, step]);

  // Warm the cache so the preview image is ready by the time the panel fades in.
  useEffect(() => {
    projects.forEach((item) => {
      if (item.image) new Image().src = item.image.src;
    });
  }, [projects]);

  return (
    <main className="explorer" id="top">
      <h1 className="visually-hidden">ID-Indetails project globe</h1>
      <div className="explorer__stage">
        <GlobeStage
          groups={groups}
          activeGroupId={group.id}
          activeProject={project}
          autoRotate={autoRotate}
          reducedMotion={reducedMotion}
          frameRef={frameRef}
          onSelectGroup={selectGroup}
        />
      </div>

      <div className="explorer__layout">
        <div className="explorer__frame" ref={frameRef} aria-hidden="true" />

        <div className="explorer__controls">
          <div className="explorer__motion">
            <RotationToggle rotating={autoRotate} onToggle={() => setRotationChoice(!autoRotate)} />
            <p className="explorer__hint">
              <span className="explorer__hint-pointer">Drag to turn the globe.</span>
              <span className="explorer__hint-touch">Swipe sideways to turn the globe.</span>
            </p>
          </div>
          <ProjectNavigator
            groups={groups}
            activeGroupId={group.id}
            position={index + 1}
            total={projects.length}
            onSelectGroup={selectGroup}
            onStep={step}
          />
        </div>

        <section className="explorer__panel" id="project" aria-label="Selected project">
          <ProjectPanel
            project={project}
            group={group}
            onSelectProject={setSelectedId}
            onOpenDetails={() => setDetailsOpen(true)}
          />
          <p className="explorer__sample-note">Sample projects, shown for demonstration.</p>
        </section>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {`${project.title}, ${project.location.city}. Project ${index + 1} of ${projects.length}.`}
      </p>

      <ProjectDetailDialog project={project} open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </main>
  );
}
