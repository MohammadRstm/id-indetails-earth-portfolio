import { useEffect, useMemo } from 'react';
import { BackSide, FrontSide, ShaderMaterial, SphereGeometry, type Side } from 'three';
import type { SceneUniforms } from './sceneUniforms';
import { earthFragmentShader, earthVertexShader } from './shaders';
import type { CountryAssets } from './useCountryData';

interface EarthProps {
  assets: CountryAssets;
  uniforms: SceneUniforms;
  /** Width and height segments of the sphere. */
  segments: [number, number];
}

/**
 * Two passes over one sphere: the inside (far hemisphere) first, faintly, then
 * the outside. The near side writes depth so markers and routes behind the
 * planet stay hidden even though its oceans are see-through.
 */
export function Earth({ assets, uniforms, segments: [widthSegments, heightSegments] }: EarthProps) {
  const geometry = useMemo(() => new SphereGeometry(1, widthSegments, heightSegments), [widthSegments, heightSegments]);
  const [far, near] = useMemo(() => {
    const pass = (side: Side, farSide: boolean) =>
      new ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        side,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: !farSide,
        uniforms: {
          uLand: { value: assets.land },
          uFarSide: { value: farSide ? 1 : 0 },
          uHighlight: uniforms.uHighlight,
          uHighlightLevel: uniforms.uHighlightLevel,
          uSunDir: uniforms.uSunDir,
          uReveal: uniforms.uReveal,
        },
      });
    return [pass(BackSide, true), pass(FrontSide, false)];
  }, [assets, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(
    () => () => {
      far.dispose();
      near.dispose();
    },
    [far, near],
  );

  return (
    <>
      <mesh geometry={geometry} material={far} renderOrder={0} />
      <mesh geometry={geometry} material={near} renderOrder={1} />
    </>
  );
}
