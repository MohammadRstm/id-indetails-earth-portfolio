import { useEffect, useMemo } from 'react';
import { ShaderMaterial } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { earthVertexShader, fallbackEarthFragmentShader } from './shaders';

/** Procedural graticule globe shown when the Earth imagery cannot be loaded. */
export function FallbackEarth({ uniforms }: { uniforms: SceneUniforms }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: fallbackEarthFragmentShader,
        uniforms: {
          uSunDir: uniforms.uSunDir,
          uAtmosphere: uniforms.uAtmosphere,
          uReveal: uniforms.uReveal,
        },
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  );
}
