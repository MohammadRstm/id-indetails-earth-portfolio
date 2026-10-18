import { useEffect, useMemo } from 'react';
import { Color, Quaternion, ShaderMaterial, Vector3 } from 'three';
import type { Office } from '../data/offices';
import { latLngToVector } from '../lib/geo';
import type { SceneUniforms } from './sceneUniforms';

/** A little above the project markers, so a studio in the same city sits on top. */
const SURFACE_LIFT = 0.005;
const DISC_HALF_SIZE = 0.03;
const OFFICE_COLOR = new Color('#ff3b3b');

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uReveal;
  uniform float uHalf;
  varying vec2 vUv;

  void main() {
    float r = length(vUv - 0.5) * 2.0 * uHalf;
    float aa = max(fwidth(r), 1e-5);
    float core = 1.0 - smoothstep(0.0085 - aa, 0.0085 + aa, r);
    float ring = 1.0 - smoothstep(0.0006 - aa, 0.0006 + aa, abs(r - 0.014));
    float halo = exp(-r / 0.007) * 0.35;
    float edge = 1.0 - smoothstep(0.75, 1.0, r / uHalf);
    float alpha = clamp((core + ring * 0.7 + halo) * edge * uReveal, 0.0, 1.0);
    gl_FragColor = vec4(uColor, alpha);
    #include <colorspace_fragment>
  }
`;

interface OfficeMarkersProps {
  offices: Office[];
  uniforms: SceneUniforms;
}

/** The studios: still red dots with a thin ring. Their names are DOM labels placed by the marker projector. */
export function OfficeMarkers({ offices, uniforms }: OfficeMarkersProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: OFFICE_COLOR }, uHalf: { value: DISC_HALF_SIZE }, uReveal: uniforms.uReveal },
      }),
    [uniforms],
  );
  useEffect(() => () => material.dispose(), [material]);

  const placed = useMemo(() => {
    const up = new Vector3(0, 0, 1);
    return offices.map((office) => {
      const { x, y, z } = latLngToVector(office.lat, office.lng);
      const normal = new Vector3(x, y, z);
      return { id: office.id, position: normal, quaternion: new Quaternion().setFromUnitVectors(up, normal) };
    });
  }, [offices]);

  return (
    <>
      {placed.map(({ id, position, quaternion }) => (
        <group key={id} position={position} quaternion={quaternion}>
          <mesh material={material} position-z={SURFACE_LIFT} renderOrder={4}>
            <planeGeometry args={[DISC_HALF_SIZE * 2, DISC_HALF_SIZE * 2]} />
          </mesh>
        </group>
      ))}
    </>
  );
}
