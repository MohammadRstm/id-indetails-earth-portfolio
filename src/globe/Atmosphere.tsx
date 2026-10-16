import { useEffect, useMemo } from 'react';
import { AddEquation, BackSide, CustomBlending, OneFactor, ShaderMaterial, ZeroFactor } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { atmosphereFragmentShader, atmosphereVertexShader } from './shaders';

/** Shell radius for the whole-globe view and for the close-up. */
const SHELL_RADIUS_FAR = 1.17;
const SHELL_RADIUS_NEAR = 1.055;

export function Atmosphere({ uniforms }: { uniforms: SceneUniforms }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        side: BackSide,
        // Adds colour but leaves the canvas alpha alone, so no dark ring appears over the page background.
        blending: CustomBlending,
        blendEquation: AddEquation,
        blendSrc: OneFactor,
        blendDst: OneFactor,
        blendSrcAlpha: ZeroFactor,
        blendDstAlpha: OneFactor,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uColor: uniforms.uAtmosphere,
          uSunDir: uniforms.uSunDir,
          uReveal: uniforms.uReveal,
          uZoom: uniforms.uZoom,
          uRadiusFar: { value: SHELL_RADIUS_FAR },
          uRadiusNear: { value: SHELL_RADIUS_NEAR },
        },
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    // The vertex shader sets the shell's radius, so the unit-sphere bounds would cull it wrongly.
    <mesh material={material} frustumCulled={false} renderOrder={2}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  );
}
