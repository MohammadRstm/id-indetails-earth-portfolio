import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from 'three';
import { mulberry32 } from '../lib/random';
import { starsFragmentShader, starsVertexShader } from './shaders';

const STAR_COUNT = 1100;
/** Stars fill a cone behind the globe; the camera never turns, so nothing is wasted. */
const CONE_HALF_ANGLE = (52 * Math.PI) / 180;
const STAR_PALETTE = ['#f2f2f2', '#f2f2f2', '#d9d9d9', '#bfc6d1', '#e8e2d6'].map((hex) => new Color(hex));

function buildStars(): BufferGeometry {
  const random = mulberry32(20261016);
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const brightness = new Float32Array(STAR_COUNT);
  const cosMax = Math.cos(CONE_HALF_ANGLE);

  for (let i = 0; i < STAR_COUNT; i++) {
    // Uniform direction inside a cone around -Z.
    const cosTheta = 1 - random() * (1 - cosMax);
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const phi = random() * Math.PI * 2;
    const distance = 70 + random() * 50;
    positions[i * 3] = Math.cos(phi) * sinTheta * distance;
    positions[i * 3 + 1] = Math.sin(phi) * sinTheta * distance;
    positions[i * 3 + 2] = 5 - cosTheta * distance;

    const color = STAR_PALETTE[Math.floor(random() * STAR_PALETTE.length)];
    colors.set([color.r, color.g, color.b], i * 3);
    sizes[i] = 0.9 + Math.pow(random(), 7) * 2.8;
    brightness[i] = 0.12 + Math.pow(random(), 3.2) * 0.75;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aBrightness', new BufferAttribute(brightness, 1));
  return geometry;
}

export function Starfield() {
  const dpr = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => buildStars(), []);
  // The pixel ratio only changes when the window moves between screens or zooms, so a new material then is cheap.
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

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
}
