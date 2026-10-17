import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { LocationGroup } from '../lib/geo';
import { latLngToVector } from '../lib/geo';
import { easeTowards, setUniform, type EffectUniforms } from './effectUniforms';
import type { SceneUniforms } from './sceneUniforms';

const SURFACE_LIFT = 0.004;
/** Half the side of the flat quad that carries the dot and its ripples, in globe radii. */
const DISC_HALF_SIZE = 0.1;
const MARKER_COLOR = new Color('#3d8bff');
const FADE_RATE = 7;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActive;
  uniform float uTime;
  uniform float uAnimate;
  uniform float uReveal;
  uniform float uHalf;
  uniform float uSeed;
  varying vec2 vUv;

  float band(float r, float radius, float halfWidth, float aa) {
    return 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, abs(r - radius));
  }

  void main() {
    float r = length(vUv - 0.5) * 2.0 * uHalf;
    float aa = max(fwidth(r), 1e-5);

    float dotRadius = mix(0.008, 0.012, uActive);
    float core = 1.0 - smoothstep(dotRadius - aa, dotRadius + aa, r);
    float halo = exp(-r / mix(0.008, 0.014, uActive)) * mix(0.3, 0.55, uActive);

    // Two rings spread out from the dot in turn and fade as they go.
    float reach = mix(0.045, 0.085, uActive);
    float ripples = 0.0;
    for (int i = 0; i < 2; i++) {
      float phase = fract(uTime / 2.8 + uSeed + float(i) * 0.5);
      float radius = mix(dotRadius, reach, 1.0 - pow(1.0 - phase, 2.0));
      ripples += band(r, radius, 0.0008 + 0.001 * phase, aa) * pow(1.0 - phase, 1.6);
    }
    // Without motion, a single still ring stands in for the ripple.
    float still = band(r, reach * 0.55, 0.0007, aa) * 0.6;
    float ring = mix(still, ripples, uAnimate) * mix(0.55, 1.0, uActive);

    float edge = 1.0 - smoothstep(0.75, 1.0, r / uHalf);
    float intensity = (core * 1.2 + halo + ring) * mix(0.7, 1.0, uActive) * edge * uReveal;
    gl_FragColor = vec4(uColor, clamp(intensity, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;

interface Marker {
  id: string;
  position: Vector3;
  quaternion: Quaternion;
  material: ShaderMaterial;
}

interface MarkerBeaconsProps {
  groups: LocationGroup[];
  activeGroupId: string;
  uniforms: SceneUniforms;
  effects: EffectUniforms;
}

/**
 * A small blue dot with a ripple for each place, drawn on the surface in the
 * globe's own space so it turns with the Earth and is hidden by the planet.
 * The selected place is a little larger and brighter.
 */
export function MarkerBeacons({ groups, activeGroupId, uniforms, effects }: MarkerBeaconsProps) {
  const invalidate = useThree((state) => state.invalidate);
  // Written by the frame loop every frame, so kept out of render-time values.
  const live = useRef<Marker[]>([]);

  const markers = useMemo<Marker[]>(() => {
    const up = new Vector3(0, 0, 1);
    return groups.map((group, index) => {
      const { x, y, z } = latLngToVector(group.lat, group.lng);
      const normal = new Vector3(x, y, z);
      return {
        id: group.id,
        position: normal,
        quaternion: new Quaternion().setFromUnitVectors(up, normal),
        material: new ShaderMaterial({
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          side: DoubleSide,
          uniforms: {
            uColor: { value: MARKER_COLOR },
            uActive: { value: 0 },
            uHalf: { value: DISC_HALF_SIZE },
            // Spreads the ripples so the places do not pulse in step.
            uSeed: { value: (index * 0.37) % 1 },
            uTime: effects.uTime,
            uAnimate: effects.uAnimate,
            uReveal: uniforms.uReveal,
          },
        }),
      };
    });
  }, [groups, uniforms, effects]);

  useEffect(() => {
    live.current = markers;
  }, [markers]);
  useEffect(() => () => markers.forEach(({ material }) => material.dispose()), [markers]);
  useEffect(() => invalidate(), [activeGroupId, markers, invalidate]);

  useFrame((state, delta) => {
    let moving = false;
    for (const { id, material } of live.current) {
      const target = id === activeGroupId ? 1 : 0;
      const current = material.uniforms.uActive.value as number;
      if (current === target) continue;
      setUniform(material, 'uActive', easeTowards(current, target, Math.min(delta, 1 / 20), FADE_RATE));
      moving = true;
    }
    if (moving) state.invalidate();
  });

  return (
    <>
      {markers.map(({ id, position, quaternion, material }) => (
        <group key={id} position={position} quaternion={quaternion}>
          <mesh material={material} position-z={SURFACE_LIFT} renderOrder={3}>
            <planeGeometry args={[DISC_HALF_SIZE * 2, DISC_HALF_SIZE * 2]} />
          </mesh>
        </group>
      ))}
    </>
  );
}
