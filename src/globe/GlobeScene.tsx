import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Group, PerspectiveCamera } from 'three';
import type { Office } from '../data/offices';
import { findCountry } from '../lib/countries';
import type { LocationGroup } from '../lib/geo';
import { CountryBorders } from './CountryBorders';
import { Dust } from './Dust';
import { createEffectUniforms, type EffectUniforms } from './effectUniforms';
import { Earth } from './Earth';
import { FallbackEarth } from './FallbackEarth';
import { frameCamera, rollFor } from './framing';
import type { GlobeController } from './GlobeController';
import type { GlobeLayout } from './GlobeLayout';
import { MarkerBeacons } from './MarkerBeacons';
import type { MarkerProjector } from './MarkerProjector';
import { OfficeMarkers } from './OfficeMarkers';
import { Routes } from './Routes';
import { createSceneUniforms, type SceneUniforms } from './sceneUniforms';
import { Starfield } from './Starfield';
import type { CountryState } from './useCountryData';

const REVEAL_SECONDS = 1.8;

export interface GlobeSceneProps {
  groups: LocationGroup[];
  activeGroupId: string;
  /** Where the selected project is; its country's outline glows. */
  activeLocation: { lat: number; lng: number };
  offices: Office[];
  controller: GlobeController;
  projector: MarkerProjector;
  layout: GlobeLayout;
  countries: CountryState;
  /** Ripples and route flow run only while this is on. */
  animate: boolean;
}

export function GlobeScene({
  groups,
  activeGroupId,
  activeLocation,
  offices,
  controller,
  projector,
  layout,
  countries,
  animate,
}: GlobeSceneProps) {
  const [uniforms] = useState(createSceneUniforms);
  const [effects] = useState(createEffectUniforms);
  const rollRef = useRef<Group>(null);
  const globeRef = useRef<Group>(null);
  const data = countries.status === 'ready' ? countries.assets.data : null;
  const { lat, lng } = activeLocation;
  const activeCountryId = useMemo(() => (data ? (findCountry(data.countries, lng, lat)?.id ?? null) : null), [data, lat, lng]);

  return (
    <>
      <Starfield />
      <group ref={rollRef} rotation={[0, 0, rollFor(0)]}>
        <group ref={globeRef}>
          {countries.status === 'ready' && (
            <>
              <Earth assets={countries.assets} uniforms={uniforms} />
              <CountryBorders data={countries.assets.data} activeCountryId={activeCountryId} uniforms={uniforms} />
            </>
          )}
          {countries.status === 'error' && <FallbackEarth uniforms={uniforms} />}
          {countries.status !== 'loading' && (
            <>
              <Routes groups={groups} activeGroupId={activeGroupId} uniforms={uniforms} effects={effects} />
              <MarkerBeacons groups={groups} activeGroupId={activeGroupId} uniforms={uniforms} effects={effects} />
              <OfficeMarkers offices={offices} uniforms={uniforms} />
              <Dust />
            </>
          )}
        </group>
      </group>
      <GlobeDriver
        controller={controller}
        projector={projector}
        layout={layout}
        uniforms={uniforms}
        effects={effects}
        rollRef={rollRef}
        globeRef={globeRef}
        revealing={countries.status !== 'loading'}
        animate={animate}
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
  /** The outer group that leans the globe; it leans further in the close-up. */
  rollRef: RefObject<Group | null>;
  globeRef: RefObject<Group | null>;
  revealing: boolean;
  animate: boolean;
}

/**
 * The single per-frame loop. The canvas renders on demand; this keeps
 * requesting frames only while something is actually moving.
 */
function GlobeDriver({ controller, projector, layout, uniforms, effects, rollRef, globeRef, revealing, animate }: GlobeDriverProps) {
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

  useEffect(() => invalidate(), [animate, invalidate]);

  useFrame((state, delta) => {
    const now = performance.now() / 1000;
    const dt = Math.min(delta, 1 / 20);
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const last = framed.current;
    let active = controller.update(dt, now);
    if (layout.step(dt)) active = true;
    const { zoom } = controller;
    if (last.version !== layout.version || last.width !== width || last.height !== height || last.zoom !== zoom) {
      frameCamera(camera, layout, zoom, width, height);
      // The marker projector needs this frame's view matrix, which three would otherwise only update at render time.
      camera.updateMatrixWorld();
      framed.current = { version: layout.version, width, height, zoom };
    }

    const globe = globeRef.current;
    if (globe) globe.rotation.set(controller.pitch - controller.tilt, controller.yaw, 0);
    if (rollRef.current) rollRef.current.rotation.z = rollFor(zoom);

    effectUniforms.current.uAnimate.value = animate ? 1 : 0;
    if (animate) {
      effectUniforms.current.uTime.value += dt;
      active = true;
    }

    if (revealing && reveal.current < 1) {
      reveal.current = Math.min(1, reveal.current + dt / REVEAL_SECONDS);
      sceneUniforms.current.uReveal.value = 1 - Math.pow(1 - reveal.current, 3);
      active = true;
    }

    if (globe) projector.update(camera, globe, width, height);
    if (active) state.invalidate();
  });

  return null;
}
