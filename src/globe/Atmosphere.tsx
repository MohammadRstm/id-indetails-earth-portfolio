import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BackSide, ShaderMaterial } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { atmosphereFragmentShader, atmosphereVertexShader } from './shaders';

const SHELL_RADIUS = 1.17;

export function Atmosphere({ uniforms }: { uniforms: SceneUniforms }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: uniforms.uAtmosphere,
          uSunDir: uniforms.uSunDir,
          uReveal: uniforms.uReveal,
          // Value of -dot(N, V) where the shell's back face meets the Earth's limb.
          uEdge: { value: Math.sqrt(1 - 1 / (SHELL_RADIUS * SHELL_RADIUS)) },
        },
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} scale={SHELL_RADIUS} renderOrder={2}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  );
}
