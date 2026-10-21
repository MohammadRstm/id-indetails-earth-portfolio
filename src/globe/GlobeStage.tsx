import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Office } from '../data/offices';
import { projectTypeLabel, type Project } from '../data/project';
import type { LocationGroup } from '../lib/geo';
import { orientationFor, tagSide } from '../lib/geo';
import { isWebGL2Available } from '../lib/webgl';
import { GlobeController } from './GlobeController';
import { GlobeLayout } from './GlobeLayout';
import { GlobeScene } from './GlobeScene';
import { MarkerProjector } from './MarkerProjector';
import { useCountryData } from './useCountryData';
import './globe.css';

/** Share of the layout frame's shorter side the globe fills (more on narrow screens). */
const globeFill = (frameWidth: number) => (frameWidth < 600 ? 0.92 : 0.86);
/** The opening turn starts this far west of the featured project. */
const INTRO_YAW_OFFSET = -1.05;
const DRAG_RADIANS_PER_RADIUS = 1.1;

const nowSeconds = () => performance.now() / 1000;

interface GlobeStageProps {
  groups: LocationGroup[];
  offices: Office[];
  activeGroupId: string;
  activeProject: Project;
  /** Close-up of the active project, used while its page is open. */
  closeUp: boolean;
  /** Dragging the globe and clicking its places; off during the close-up. */
  interactive: boolean;
  /** Ripples and route flow. */
  animate: boolean;
  reducedMotion: boolean;
  /** Empty layout cell the globe is centred in. */
  frameRef: RefObject<HTMLElement | null>;
  onSelectGroup: (groupId: string) => void;
}

export function GlobeStage({
  groups,
  offices,
  activeGroupId,
  activeProject,
  closeUp,
  interactive,
  animate,
  reducedMotion,
  frameRef,
  onSelectGroup,
}: GlobeStageProps) {
  const [webgl] = useState(isWebGL2Available);
  const countries = useCountryData(webgl);
  const ready = countries.status !== 'loading';
  const [controller] = useState(() => {
    const { lat, lng } = activeProject.location;
    const start = orientationFor(lat, lng);
    if (!reducedMotion) start.yaw += INTRO_YAW_OFFSET;
    // The globe only turns to follow the selected project; it has no spin of its own.
    return new GlobeController(start, { autoRotate: false, reducedMotion });
  });
  const [projector] = useState(() => new MarkerProjector());
  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const [layout] = useState(() => new GlobeLayout());
  const [contextLost, setContextLost] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; pitch: boolean } | null>(null);

  useEffect(() => controller.setReducedMotion(reducedMotion), [controller, reducedMotion]);
  useEffect(() => controller.setCloseUp(closeUp), [controller, closeUp]);

  // Nothing needs to animate while the globe is scrolled out of view.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => controller.requestFrame(), [controller, activeGroupId]);

  useEffect(() => {
    if (!ready) return;
    const { lat, lng } = activeProject.location;
    controller.focus(lat, lng, nowSeconds());
  }, [ready, activeProject, controller]);

  // A passive effect: the frame is a later sibling, so its ref is not attached yet during layout effects.
  useEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (!viewport || !frame) return;
    const measure = () => {
      const outer = viewport.getBoundingClientRect();
      const inner = frame.getBoundingClientRect();
      const centerX = inner.left - outer.left + inner.width / 2;
      const centerY = inner.top - outer.top + inner.height / 2;
      const diameter = Math.min(inner.width, inner.height) * globeFill(inner.width);
      layout.update(centerX, centerY, diameter, inner.width, inner.height, reducedMotion);
      viewport.style.setProperty('--globe-x', `${centerX}px`);
      viewport.style.setProperty('--globe-y', `${centerY}px`);
      viewport.style.setProperty('--globe-d', `${diameter}px`);
      controller.requestFrame();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frameRef, layout, controller, reducedMotion]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!ready || !interactive || event.button !== 0 || (event.target as Element).closest('.globe-marker')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, pitch: event.pointerType !== 'touch' };
    controller.beginDrag(nowSeconds());
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const radiansPerPixel = (DRAG_RADIANS_PER_RADIUS / Math.max(120, layout.diameter / 2)) * controller.dragScale;
    const deltaPitch = current.pitch ? (event.clientY - current.y) * radiansPerPixel : 0;
    controller.dragBy((event.clientX - current.x) * radiansPerPixel, deltaPitch, nowSeconds());
    current.x = event.clientX;
    current.y = event.clientY;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    controller.endDrag(nowSeconds());
  };

  let notice: string | null = null;
  if (!webgl) notice = 'This browser cannot display the 3D globe. Every project is still listed below.';
  else if (contextLost) notice = 'The 3D view was interrupted by the graphics driver. Reload the page to restore it.';
  else if (countries.status === 'error') notice = 'The map could not be loaded, so a simplified globe is shown.';

  return (
    <div
      ref={viewportRef}
      className="globe-stage"
      data-ready={ready}
      data-webgl={webgl}
      data-interactive={interactive}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {webgl && (
        <div className="globe-stage__canvas" role="img" aria-label="3D Earth with project locations marked">
          <Canvas
            frameloop="demand"
            flat
            dpr={[1, 1.5]}
            camera={{ fov: 30, near: 0.1, far: 300, position: [0, 0, 6] }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault();
                setContextLost(true);
              });
              gl.domElement.addEventListener('webglcontextrestored', () => setContextLost(false));
            }}
          >
            <GlobeScene
              groups={groups}
              activeGroupId={activeGroupId}
              controller={controller} projector={projector}
              layout={layout}
              countries={countries}
              activeLocation={activeProject.location}
              offices={offices}
              animate={animate && onScreen}
            />
          </Canvas>
        </div>
      )}

      <div className="globe-stage__markers">
        {webgl &&
          groups.map((group) => (
            <GlobeMarker
              key={group.id}
              group={group}
              active={group.id === activeGroupId}
              projector={projector}
              onSelect={onSelectGroup}
            />
          ))}
        {webgl && activeGroup && <TypeTag key={activeGroup.id} group={activeGroup} offices={offices} projector={projector} />}
        {webgl && offices.map((office) => <OfficeLabel key={office.id} office={office} projector={projector} />)}
      </div>

      {webgl && countries.status === 'loading' && (
        <div className="globe-loader" role="status">
          <span className="globe-loader__ring" aria-hidden="true" />
          <span className="globe-loader__text">Loading the globe</span>
        </div>
      )}

      {notice && (
        <p className="globe-stage__notice" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

interface GlobeMarkerProps {
  group: LocationGroup;
  active: boolean;
  projector: MarkerProjector;
  onSelect: (groupId: string) => void;
}

/**
 * Pointer affordance only: keyboard and screen-reader users reach projects
 * through the project controls beside the strip.
 */
function GlobeMarker({ group, active, projector, onSelect }: GlobeMarkerProps) {
  const { id, lat, lng } = group;
  const attach = useCallback(
    (element: HTMLButtonElement | null) => {
      if (!element) return;
      projector.register(id, lat, lng, element);
      return () => projector.unregister(id);
    },
    [projector, id, lat, lng],
  );

  return (
    <button
      ref={attach}
      type="button"
      className="globe-marker"
      data-active={active}
      tabIndex={-1}
      aria-hidden="true"
      title={group.projects.map((project) => project.title).join(', ')}
      onClick={() => onSelect(group.id)}
    />
  );
}

/** How far the tag sits above and beside its point, in px. */
const TAG_RUN = 18;
const TAG_RISE = 22;
/** The pointer stops this short of the point, and its arrowhead is this long. */
const TAG_GAP = 4;
const TAG_HEAD = 5;

/**
 * The selected place's type of project ("Villa", or "Villa · Hotel"), above
 * and beside its point, with a pointer to it. Only the selected place has
 * one, so the globe stays clean.
 */
function TypeTag({ group, offices, projector }: { group: LocationGroup; offices: Office[]; projector: MarkerProjector }) {
  const side = tagSide(group, offices);
  const { id, lat, lng } = group;
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      projector.register(`tag-${id}`, lat, lng, element);
      return () => projector.unregister(`tag-${id}`);
    },
    [projector, id, lat, lng],
  );

  const label = [...new Set(group.projects.map((project) => project.type))].map((type) => projectTypeLabel[type]).join(' · ');
  // The pointer runs from the tag's end (0, 0) down to the point (run, rise), stopping just short of it.
  const run = TAG_RUN;
  const rise = TAG_RISE;
  const length = Math.hypot(run, rise);
  const [ux, uy] = [run / length, rise / length];
  const [tipX, tipY] = [run - ux * TAG_GAP, rise - uy * TAG_GAP];
  const head = (turn: number) => {
    const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
    return `${(tipX - TAG_HEAD * (ux * cos - uy * sin)).toFixed(1)},${(tipY - TAG_HEAD * (ux * sin + uy * cos)).toFixed(1)}`;
  };

  return (
    <div ref={attach} className="globe-tag" data-side={side} aria-hidden="true">
      {/* Drawn for the left side; the right side mirrors it (see globe.css). */}
      <svg
        className="globe-tag__pointer"
        width={run}
        height={rise}
        viewBox={`0 0 ${run} ${rise}`}
        style={{ left: side === 'left' ? -run : 0, top: -rise }}
      >
        <line x1={0} y1={0} x2={tipX.toFixed(1)} y2={tipY.toFixed(1)} />
        <polyline points={`${head(0.45)} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${head(-0.45)}`} />
      </svg>
      <span className="globe-tag__label" style={side === 'left' ? { right: run + 4, bottom: rise } : { left: run + 4, bottom: rise }}>
        {label}
      </span>
    </div>
  );
}

/** The company's name beside each studio's red dot; it turns with the globe like the markers. */
function OfficeLabel({ office, projector }: { office: Office; projector: MarkerProjector }) {
  const { id, lat, lng } = office;
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element) return;
      projector.register(`office-${id}`, lat, lng, element);
      return () => projector.unregister(`office-${id}`);
    },
    [projector, id, lat, lng],
  );

  return (
    <div ref={attach} className="globe-office">
      <span className="globe-office__name">ID-Indetails</span>
      <span className="globe-office__city">{office.city}</span>
    </div>
  );
}
