import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Group, PerspectiveCamera } from 'three';
import type { LocationGroup } from '../lib/geo';
import { Atmosphere } from './Atmosphere';
import { createEffectUniforms, type EffectUniforms } from './effectUniforms';
import { Earth } from './Earth';
import { FallbackEarth } from './FallbackEarth';
import { AXIAL_ROLL, frameCamera } from './framing';
import type { GlobeController } from './GlobeController';
import type { GlobeLayout } from './GlobeLayout';
import { MarkerBeacons } from './MarkerBeacons';
import type { MarkerProjector } from './MarkerProjector';
import { Routes } from './Routes';
import { createSceneUniforms, type SceneUniforms } from './sceneUniforms';
import { Starfield } from './Starfield';
import type { EarthTextureState } from './useEarthTextures';

const REVEAL_SECONDS = 1.8;

export interface GlobeSceneProps {
  groups: LocationGroup[];
  activeGroupId: string;
  controller: GlobeController;
  projector: MarkerProjector;
  layout: GlobeLayout;
  textures: EarthTextureState;
}

export function GlobeScene({ groups, activeGroupId, controller, projector, layout, textures }: GlobeSceneProps) {
  const [uniforms] = useState(createSceneUniforms);
  const [effects] = useState(createEffectUniforms);
  const globeRef = useRef<Group>(null);

  return (
    <>
      <Starfield />
      <group rotation={[0, 0, AXIAL_ROLL]}>
        <group ref={globeRef}>
          {textures.status === 'ready' && <Earth textures={textures.textures} uniforms={uniforms} />}
          {textures.status === 'error' && <FallbackEarth uniforms={uniforms} />}
          {textures.status !== 'loading' && (
            <>
              <Routes groups={groups} activeGroupId={activeGroupId} uniforms={uniforms} effects={effects} />
              <MarkerBeacons groups={groups} activeGroupId={activeGroupId} uniforms={uniforms} effects={effects} />
            </>
          )}
        </group>
        {textures.status !== 'loading' && <Atmosphere uniforms={uniforms} />}
      </group>
      <GlobeDriver
        controller={controller}
        projector={projector}
        layout={layout}
        uniforms={uniforms}
        effects={effects}
        globeRef={globeRef}
        revealing={textures.status !== 'loading'}
      />
    </>
  );
}

interface GlobeDriverProps {
  controller: GlobeController;
  projector: MarkerProjector;
  layout: GlobeLayout;
  uniforms: SceneUniforms;
  effects: EffectUniforms;
  globeRef: RefObject<Group | null>;
  revealing: boolean;
}

/**
 * The single per-frame loop. The canvas renders on demand; this keeps
 * requesting frames only while something is actually moving.
 */
function GlobeDriver({ controller, projector, layout, uniforms, effects, globeRef, revealing }: GlobeDriverProps) {
  const invalidate = useThree((state) => state.invalidate);
  const framed = useRef({ version: -1, width: 0, height: 0, zoom: -1 });
  const reveal = useRef(0);
  // The uniform objects are shared by every globe material and mutated in place each frame.
  const sceneUniforms = useRef(uniforms);
  const effectUniforms = useRef(effects);

  useEffect(() => {
    controller.setWakeHandler(() => invalidate());
    invalidate();
    return () => controller.setWakeHandler(() => {});
  }, [controller, invalidate]);

  useEffect(() => {
    sceneUniforms.current = uniforms;
    effectUniforms.current = effects;
  }, [uniforms, effects]);

  useEffect(() => {
    if (revealing) invalidate();
  }, [revealing, invalidate]);

  useFrame((state, delta) => {
    const now = performance.now() / 1000;
    const dt = Math.min(delta, 1 / 20);
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const last = framed.current;
    let active = controller.update(dt, now);
    const { zoom } = controller;
    if (last.version !== layout.version || last.width !== width || last.height !== height || last.zoom !== zoom) {
      frameCamera(camera, layout, zoom, width, height);
      framed.current = { version: layout.version, width, height, zoom };
    }

    sceneUniforms.current.uZoom.value = zoom;

    const globe = globeRef.current;
    if (globe) globe.rotation.set(controller.pitch - controller.tilt, controller.yaw, 0);

    const animate = controller.autoRotate && !controller.reducedMotion;
    effectUniforms.current.uAnimate.value = animate ? 1 : 0;
    if (animate) effectUniforms.current.uTime.value += dt;

    if (revealing && reveal.current < 1) {
      reveal.current = Math.min(1, reveal.current + dt / REVEAL_SECONDS);
      sceneUniforms.current.uReveal.value = 1 - Math.pow(1 - reveal.current, 3);
      active = true;
    }

    if (globe) projector.update(camera, globe, width, height, zoom);
    if (active) state.invalidate();
  });

  return null;
}
