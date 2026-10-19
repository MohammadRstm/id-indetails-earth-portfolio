import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { mulberry32 } from '../lib/random';
import { starsFragmentShader, starsVertexShader } from './shaders';

const PARTICLE_COUNT = 700;
const INNER_RADIUS = 1.03;
const OUTER_RADIUS = 1.45;

function buildDust(): BufferGeometry {
  const random = mulberry32(17);
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3).fill(0.85);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const brightness = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Uniform direction, with the particles thinning out away from the surface.
    const z = random() * 2 - 1;
    const phi = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z);
    const radius = INNER_RADIUS + Math.pow(random(), 2.2) * (OUTER_RADIUS - INNER_RADIUS);
    positions[i * 3] = Math.cos(phi) * ring * radius;
    positions[i * 3 + 1] = z * radius;
    positions[i * 3 + 2] = Math.sin(phi) * ring * radius;
    sizes[i] = 0.8 + Math.pow(random(), 4) * 1.6;
    brightness[i] = 0.08 + Math.pow(random(), 2.5) * 0.4;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aBrightness', new BufferAttribute(brightness, 1));
  return geometry;
}

/** Fine particles hanging just above the surface; they turn with the globe and are hidden behind it. */
export function Dust() {
  const dpr = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => buildDust(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starsVertexShader,
        fragmentShader: starsFragmentShader,
        uniforms: { uPixelRatio: { value: dpr } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
      }),
    [dpr],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return <points geometry={geometry} material={material} renderOrder={2} />;
}
