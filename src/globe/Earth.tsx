import { useEffect, useMemo } from 'react';
import { ShaderMaterial } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { earthFragmentShader, earthVertexShader } from './shaders';
import type { EarthTextures } from './useEarthTextures';

/** Scales the normal map's slopes; higher reads as more dramatic relief. */
const NORMAL_STRENGTH = 2.2;

interface EarthProps {
  textures: EarthTextures;
  uniforms: SceneUniforms;
}

export function Earth({ textures, uniforms }: EarthProps) {
  const surface = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        uniforms: {
          uDay: { value: textures.day },
          uLights: { value: textures.lights },
          uWater: { value: textures.water },
          uNormal: { value: textures.normal },
          uNormalStrength: { value: NORMAL_STRENGTH },
          uSunDir: uniforms.uSunDir,
          uAtmosphere: uniforms.uAtmosphere,
          uReveal: uniforms.uReveal,
        },
      }),
    [textures, uniforms],
  );

  useEffect(() => () => surface.dispose(), [surface]);

  return (
    <mesh material={surface}>
      <sphereGeometry args={[1, 192, 128]} />
    </mesh>
  );
}
