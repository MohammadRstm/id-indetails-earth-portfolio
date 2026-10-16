import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, PlaneGeometry, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { LocationGroup } from '../lib/geo';
import { latLngToVector } from '../lib/geo';
import { easeTowards, setUniform, type EffectUniforms } from './effectUniforms';
import type { SceneUniforms } from './sceneUniforms';

const SURFACE_LIFT = 0.003;
/** Half the side of the flat quad that carries the dot and rings, in globe radii. */
const DISC_HALF_SIZE = 0.075;
const BEAM_HEIGHT = 0.08;
const BEAM_WIDTH = 0.018;
const BEACON_COLOR = new Color('#5be3ff');
const FADE_RATE = 7;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const discFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActive;
  uniform float uTime;
  uniform float uAnimate;
  uniform float uReveal;
  uniform float uHalf;
  varying vec2 vUv;

  float band(float r, float radius, float halfWidth, float aa) {
    return 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, abs(r - radius));
  }

  void main() {
    float r = length(vUv - 0.5) * 2.0 * uHalf;
    float aa = max(fwidth(r), 1e-5);

    float dotRadius = mix(0.0048, 0.0072, uActive);
    float core = 1.0 - smoothstep(dotRadius - aa, dotRadius + aa, r);
    float glow = exp(-r / mix(0.008, 0.014, uActive)) * mix(0.3, 0.65, uActive);
    float inner = band(r, mix(0.016, 0.018, uActive), 0.0007, aa);
    float outer = band(r, 0.03, 0.0007, aa) * uActive * 0.7;

    float phase = fract(uTime / 3.2);
    float spread = 1.0 - pow(1.0 - phase, 2.0);
    float pulse = band(r, mix(0.012, 0.07, spread), 0.0007 + 0.0012 * phase, aa)
      * pow(1.0 - phase, 2.0) * uActive * uAnimate * 0.9;

    float edge = 1.0 - smoothstep(0.7, 1.0, r / uHalf);
    float level = mix(0.55, 1.0, uActive);
    float intensity = (core * 1.1 + glow + inner * mix(0.85, 1.0, uActive) + outer + pulse) * level * edge * uReveal;
    gl_FragColor = vec4(uColor, clamp(intensity, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActive;
  uniform float uTime;
  uniform float uAnimate;
  uniform float uReveal;
  varying vec2 vUv;

  void main() {
    float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
    float rise = pow(1.0 - vUv.y, 1.6);
    float shimmer = 1.0 + 0.14 * sin(vUv.y * 16.0 - uTime * 3.0) * uAnimate;
    float intensity = (pow(across, 3.0) * 0.95 + across * 0.12) * rise * shimmer * uActive * uReveal;
    gl_FragColor = vec4(uColor, clamp(intensity, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

const additive = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: DoubleSide,
} as const;

interface Beacon {
  id: string;
  position: Vector3;
  quaternion: Quaternion;
  disc: ShaderMaterial;
  beam: ShaderMaterial;
}

/** Two thin vertical planes crossed at right angles, so the beam reads from every side. */
function crossedBeamGeometry(): PlaneGeometry[] {
  const first = new PlaneGeometry(BEAM_WIDTH, BEAM_HEIGHT).rotateX(Math.PI / 2).translate(0, 0, BEAM_HEIGHT / 2);
  const second = first.clone().rotateZ(Math.PI / 2);
  return [first, second];
}

interface MarkerBeaconsProps {
  groups: LocationGroup[];
  activeGroupId: string;
  uniforms: SceneUniforms;
  effects: EffectUniforms;
}

/**
 * A glowing marker on the surface for each place: a dot and ring, and for the
 * selected place also a second ring, an expanding pulse and a short beam of
 * light. Everything is drawn in the globe's own space, so it turns with the
 * Earth, grows when the camera moves in and is hidden by the planet itself.
 */
export function MarkerBeacons({ groups, activeGroupId, uniforms, effects }: MarkerBeaconsProps) {
  const invalidate = useThree((state) => state.invalidate);
  const beams = useMemo(() => crossedBeamGeometry(), []);
  // Written by the frame loop every frame, so kept out of render-time values.
  const live = useRef<Beacon[]>([]);

  const beacons = useMemo<Beacon[]>(() => {
    const shared = (extra: Record<string, { value: number }>) => ({
      uColor: { value: BEACON_COLOR },
      uActive: { value: 0 },
      uTime: effects.uTime,
      uAnimate: effects.uAnimate,
      uReveal: uniforms.uReveal,
      ...extra,
    });
    const up = new Vector3(0, 0, 1);
    return groups.map((group) => {
      const { x, y, z } = latLngToVector(group.lat, group.lng);
      const normal = new Vector3(x, y, z);
      return {
        id: group.id,
        position: normal,
        quaternion: new Quaternion().setFromUnitVectors(up, normal),
        disc: new ShaderMaterial({
          vertexShader,
          fragmentShader: discFragmentShader,
          ...additive,
          uniforms: shared({ uHalf: { value: DISC_HALF_SIZE } }),
        }),
        beam: new ShaderMaterial({ vertexShader, fragmentShader: beamFragmentShader, ...additive, uniforms: shared({}) }),
      };
    });
  }, [groups, uniforms, effects]);

  useEffect(() => {
    live.current = beacons;
  }, [beacons]);
  useEffect(
    () => () => {
      beacons.forEach(({ disc, beam }) => {
        disc.dispose();
        beam.dispose();
      });
    },
    [beacons],
  );
  useEffect(() => () => beams.forEach((geometry) => geometry.dispose()), [beams]);
  useEffect(() => invalidate(), [activeGroupId, beacons, invalidate]);

  useFrame((state, delta) => {
    let moving = false;
    for (const { id, disc, beam } of live.current) {
      const target = id === activeGroupId ? 1 : 0;
      const current = disc.uniforms.uActive.value as number;
      if (current === target) continue;
      const next = easeTowards(current, target, Math.min(delta, 1 / 20), FADE_RATE);
      setUniform(disc, 'uActive', next);
      setUniform(beam, 'uActive', next);
      moving = true;
    }
    if (moving) state.invalidate();
  });

  return (
    <>
      {beacons.map(({ id, position, quaternion, disc, beam }) => (
        <group key={id} position={position} quaternion={quaternion}>
          <mesh material={disc} position-z={SURFACE_LIFT} renderOrder={3}>
            <planeGeometry args={[DISC_HALF_SIZE * 2, DISC_HALF_SIZE * 2]} />
          </mesh>
          {beams.map((geometry, index) => (
            <mesh key={index} geometry={geometry} material={beam} position-z={SURFACE_LIFT} renderOrder={3} />
          ))}
        </group>
      ))}
    </>
  );
}
