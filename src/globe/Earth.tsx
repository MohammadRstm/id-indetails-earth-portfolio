import { useEffect, useMemo, type RefObject } from 'react';
import { ShaderMaterial, Vector2, type Mesh } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { cloudsFragmentShader, cloudsVertexShader, earthFragmentShader, earthVertexShader } from './shaders';
import type { EarthTextures } from './useEarthTextures';

interface EarthProps {
  textures: EarthTextures;
  uniforms: SceneUniforms;
  cloudsRef: RefObject<Mesh | null>;
}

export function Earth({ textures, uniforms, cloudsRef }: EarthProps) {
  const surface = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        uniforms: {
          uDay: { value: textures.day },
          uLights: { value: textures.lights },
          uWater: { value: textures.water },
          uRelief: { value: textures.relief },
          uReliefTexel: { value: new Vector2(1 / 2048, 1 / 1024) },
          uSunDir: uniforms.uSunDir,
          uAtmosphere: uniforms.uAtmosphere,
          uReveal: uniforms.uReveal,
        },
      }),
    [textures, uniforms],
  );

  const clouds = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: cloudsVertexShader,
        fragmentShader: cloudsFragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uClouds: { value: textures.clouds },
          uOpacity: { value: 0.62 },
          uSunDir: uniforms.uSunDir,
          uReveal: uniforms.uReveal,
        },
      }),
    [textures, uniforms],
  );

  useEffect(
    () => () => {
      surface.dispose();
      clouds.dispose();
    },
    [surface, clouds],
  );

  return (
    <>
      <mesh material={surface}>
        <sphereGeometry args={[1, 192, 128]} />
      </mesh>
      <mesh ref={cloudsRef} material={clouds} scale={1.006} renderOrder={1}>
        <sphereGeometry args={[1, 128, 96]} />
      </mesh>
    </>
  );
}
