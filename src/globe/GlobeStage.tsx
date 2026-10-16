import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import type { Project } from '../data/project';
import type { LocationGroup } from '../lib/geo';
import { orientationFor } from '../lib/geo';
import { isWebGL2Available } from '../lib/webgl';
import { GlobeController } from './GlobeController';
import { GlobeLayout } from './GlobeLayout';
import { GlobeScene } from './GlobeScene';
import { MarkerProjector } from './MarkerProjector';
import { useEarthTextures } from './useEarthTextures';
import './globe.css';

/** Share of the layout frame's shorter side the globe fills (more on narrow screens). */
const globeFill = (frameWidth: number) => (frameWidth < 600 ? 0.92 : 0.86);
/** The opening turn starts this far west of the featured project. */
const INTRO_YAW_OFFSET = -1.05;
const DRAG_RADIANS_PER_RADIUS = 1.1;

const nowSeconds = () => performance.now() / 1000;

interface GlobeStageProps {
  groups: LocationGroup[];
  activeGroupId: string;
  activeProject: Project;
  autoRotate: boolean;
  reducedMotion: boolean;
  /** Empty layout cell the globe is centred in. */
  frameRef: RefObject<HTMLElement | null>;
  onSelectGroup: (groupId: string) => void;
}

export function GlobeStage({
  groups,
  activeGroupId,
  activeProject,
  autoRotate,
  reducedMotion,
  frameRef,
  onSelectGroup,
}: GlobeStageProps) {
  const [webgl] = useState(isWebGL2Available);
  const textures = useEarthTextures(webgl);
  const ready = textures.status !== 'loading';
  const [controller] = useState(() => {
    const { lat, lng } = activeProject.location;
    const start = orientationFor(lat, lng);
    if (!reducedMotion) start.yaw += INTRO_YAW_OFFSET;
    return new GlobeController(start, { autoRotate, reducedMotion });
  });
  const [projector] = useState(() => new MarkerProjector());
  const [layout] = useState(() => new GlobeLayout());
  const [contextLost, setContextLost] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; pitch: boolean } | null>(null);

  useEffect(() => controller.setAutoRotate(autoRotate), [controller, autoRotate]);
  useEffect(() => controller.setReducedMotion(reducedMotion), [controller, reducedMotion]);

  useEffect(() => controller.requestFrame(), [controller, activeGroupId]);

  useEffect(() => {
    projector.setStage(viewportRef.current);
    return () => projector.setStage(null);
  }, [projector]);

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
      layout.update(centerX, centerY, diameter, inner.width, inner.height);
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
  }, [frameRef, layout, controller]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!ready || event.button !== 0 || (event.target as Element).closest('.globe-marker')) return;
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

  const handleHover = useCallback((hovering: boolean) => controller.setHoverHold(hovering), [controller]);

  let notice: string | null = null;
  if (!webgl) notice = 'This browser cannot display the 3D globe. Every project is still listed below.';
  else if (contextLost) notice = 'The 3D view was interrupted by the graphics driver. Reload the page to restore it.';
  else if (textures.status === 'error') notice = 'Earth imagery could not be loaded, so a simplified globe is shown.';

  return (
    <div
      ref={viewportRef}
      className="globe-stage"
      data-ready={ready}
      data-webgl={webgl}
      data-rotating={autoRotate}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {webgl && (
        <div className="globe-stage__canvas" role="img" aria-label="Rotating 3D Earth with project locations marked">
          <Canvas
            frameloop="demand"
            flat
            dpr={[1, 1.75]}
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
              textures={textures}
            />
          </Canvas>
        </div>
      )}

      <div className="globe-stage__scrim" aria-hidden="true" />

      <div className="globe-stage__markers">
        {webgl &&
          groups.map((group) => (
            <GlobeMarker
              key={group.id}
              group={group}
              active={group.id === activeGroupId}
              projector={projector}
              onSelect={onSelectGroup}
              onHover={handleHover}
            />
          ))}
      </div>

      {webgl && textures.status === 'loading' && (
        <div className="globe-loader" role="status">
          <span className="globe-loader__ring" aria-hidden="true" />
          <span className="globe-loader__text">
            Loading Earth imagery, {textures.loaded} of {textures.total}
          </span>
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
  onHover: (hovering: boolean) => void;
}

/**
 * Pointer affordance only: keyboard and screen-reader users select projects
 * through the location list, which never moves or disappears behind the globe.
 */
function GlobeMarker({ group, active, projector, onSelect, onHover }: GlobeMarkerProps) {
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
      onClick={() => onSelect(group.id)}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <span className="globe-marker__label">
        {group.city}
        {group.projects.length > 1 && <span className="globe-marker__count">{group.projects.length} projects</span>}
      </span>
    </button>
  );
}
