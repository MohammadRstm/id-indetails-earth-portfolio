import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Group, Mesh, PerspectiveCamera } from 'three';
import { Atmosphere } from './Atmosphere';
import { Earth } from './Earth';
import { FallbackEarth } from './FallbackEarth';
import type { GlobeController } from './GlobeController';
import type { GlobeLayout } from './GlobeLayout';
import type { MarkerProjector } from './MarkerProjector';
import { createSceneUniforms, type SceneUniforms } from './sceneUniforms';
import { Starfield } from './Starfield';
import type { EarthTextureState } from './useEarthTextures';

/** A slight axial lean, so the globe reads as a planet rather than a diagram. */
const AXIAL_ROLL = -0.13;
const CLOUD_DRIFT = 0.0035;
const REVEAL_SECONDS = 1.8;

export interface GlobeSceneProps {
  controller: GlobeController;
  projector: MarkerProjector;
  layout: GlobeLayout;
  textures: EarthTextureState;
}

export function GlobeScene({ controller, projector, layout, textures }: GlobeSceneProps) {
  const uniforms = useMemo(createSceneUniforms, []);
  const globeRef = useRef<Group>(null);
  const cloudsRef = useRef<Mesh>(null);

  return (
    <>
      <Starfield />
      <group rotation={[0, 0, AXIAL_ROLL]}>
        <group ref={globeRef}>
          {textures.status === 'ready' && <Earth textures={textures.textures} uniforms={uniforms} cloudsRef={cloudsRef} />}
          {textures.status === 'error' && <FallbackEarth uniforms={uniforms} />}
        </group>
        {textures.status !== 'loading' && <Atmosphere uniforms={uniforms} />}
      </group>
      <GlobeDriver
        controller={controller}
        projector={projector}
        layout={layout}
        uniforms={uniforms}
        globeRef={globeRef}
        cloudsRef={cloudsRef}
        revealing={textures.status !== 'loading'}
      />
    </>
  );
}

/** Places the camera so the globe fills `layout.diameter` and centres it with a lens shift. */
function frameCamera(camera: PerspectiveCamera, layout: GlobeLayout, width: number, height: number): void {
  if (!layout.ready || width === 0 || height === 0) return;
  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
  const tanAngularRadius = (layout.diameter / height) * tanHalfFov;
  const distance = 1 / Math.sin(Math.atan(tanAngularRadius));
  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(width, height, width / 2 - layout.centerX, height / 2 - layout.centerY, width, height);
  camera.updateProjectionMatrix();
}

interface GlobeDriverProps {
  controller: GlobeController;
  projector: MarkerProjector;
  layout: GlobeLayout;
  uniforms: SceneUniforms;
  globeRef: RefObject<Group | null>;
  cloudsRef: RefObject<Mesh | null>;
  revealing: boolean;
}

/**
 * The single per-frame loop. The canvas renders on demand; this keeps
 * requesting frames only while something is actually moving.
 */
function GlobeDriver({ controller, projector, layout, uniforms, globeRef, cloudsRef, revealing }: GlobeDriverProps) {
  const invalidate = useThree((state) => state.invalidate);
  const framed = useRef({ version: -1, width: 0, height: 0 });
  const reveal = useRef(0);

  useEffect(() => {
    controller.setWakeHandler(() => invalidate());
    invalidate();
    return () => controller.setWakeHandler(() => {});
  }, [controller, invalidate]);

  useEffect(() => {
    if (revealing) invalidate();
  }, [revealing, invalidate]);

  useFrame((state, delta) => {
    const now = performance.now() / 1000;
    const dt = Math.min(delta, 1 / 20);
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const last = framed.current;
    if (last.version !== layout.version || last.width !== width || last.height !== height) {
      frameCamera(camera, layout, width, height);
      framed.current = { version: layout.version, width, height };
    }

    let active = controller.update(dt, now);
    const globe = globeRef.current;
    if (globe) globe.rotation.set(controller.pitch, controller.yaw, 0);

    const clouds = cloudsRef.current;
    if (clouds && controller.autoRotate && !controller.reducedMotion) clouds.rotation.y += dt * CLOUD_DRIFT;

    if (revealing && reveal.current < 1) {
      reveal.current = Math.min(1, reveal.current + dt / REVEAL_SECONDS);
      uniforms.uReveal.value = 1 - Math.pow(1 - reveal.current, 3);
      active = true;
    }

    if (globe) projector.update(camera, globe, width, height);
    if (active) state.invalidate();
  });

  return null;
}
