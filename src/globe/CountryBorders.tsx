import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments, type Material, type Object3D, type Texture } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { segmentPositions, type CountryData, type CountryShape, type LngLat } from '../lib/countries';
import { easeTowards } from './effectUniforms';
import type { SceneUniforms } from './sceneUniforms';
import { createHighlightTexture } from './useCountryData';

/** Just above the surface, so the lines clear the sphere's flat facets but stay behind the markers. */
const LINE_RADIUS = 1.0015;
const FADE_RATE = 4;

interface LineStyle {
  color: string;
  opacity: number;
}

const COAST: LineStyle = { color: '#8a909c', opacity: 0.6 };
const BORDER: LineStyle = { color: '#8a909c', opacity: 0.34 };
const HIGHLIGHT: LineStyle = { color: '#4fd8ff', opacity: 0.9 };
/** Width of the selected country's outline, in CSS pixels. */
const HIGHLIGHT_WIDTH = 1.3;

const outlineOf = (country: CountryShape): LngLat[][] => country.polygons.flat();

interface LineSet {
  lines: Object3D;
  geometry: BufferGeometry;
  material: Material;
  style: LineStyle;
}

/**
 * Coastlines and borders: about 75,000 segments, so they are plain one-pixel
 * GL lines, one cheap draw. Wide lines for all of them cost enough GPU time to
 * drop frames while the globe moves.
 */
function createThinLines(positions: Float32Array, style: LineStyle): LineSet {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  const material = new LineBasicMaterial({ color: new Color(style.color), transparent: true, opacity: 0, depthWrite: false });
  const lines = new LineSegments(geometry, material);
  lines.renderOrder = 2;
  return { lines, geometry, material, style };
}

/** The selected country's outline: few segments, so it can afford a true pixel width. */
function createWideLines(positions: Float32Array, style: LineStyle, width: number, dpr: number): LineSet {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(positions);
  const material = new LineMaterial({
    color: new Color(style.color),
    linewidth: width * dpr,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const lines = new LineSegments2(geometry, material);
  lines.renderOrder = 2;
  return { lines, geometry, material, style };
}

function fadeLines(sets: LineSet[], factor: number): void {
  for (const { material, style } of sets) material.opacity = style.opacity * factor;
}

function disposeLines(sets: LineSet[]): void {
  for (const { geometry, material } of sets) {
    geometry.dispose();
    material.dispose();
  }
}

interface Live {
  base: LineSet[];
  highlight: LineSet[];
  mask: Texture | null;
  level: number;
}

interface CountryBordersProps {
  data: CountryData;
  /** The country to outline in cyan, if any. */
  activeCountryId: string | null;
  uniforms: SceneUniforms;
}

/**
 * Coastlines and land borders as thin grey lines, and the selected country's
 * outline in cyan with a soft glow (drawn by the Earth shader from a mask, so
 * it stays smooth where the outline's segments meet). Lines are drawn in the
 * globe's own space and depth-tested against the planet, so the far side's
 * stay hidden.
 */
export function CountryBorders({ data, activeCountryId, uniforms }: CountryBordersProps) {
  const dpr = useThree((state) => state.viewport.dpr);
  const invalidate = useThree((state) => state.invalidate);
  // Read and written by the frame loop, so kept out of render-time values.
  const live = useRef<Live>({ base: [], highlight: [], mask: null, level: 0 });
  const sceneUniforms = useRef(uniforms);

  const country = useMemo(() => data.countries.find((candidate) => candidate.id === activeCountryId) ?? null, [data, activeCountryId]);

  const base = useMemo<LineSet[]>(
    () => [
      createThinLines(segmentPositions(data.coasts, LINE_RADIUS), COAST),
      createThinLines(segmentPositions(data.borders, LINE_RADIUS), BORDER),
    ],
    [data],
  );
  const highlight = useMemo<LineSet[]>(
    () => (country ? [createWideLines(segmentPositions(outlineOf(country), LINE_RADIUS), HIGHLIGHT, HIGHLIGHT_WIDTH, dpr)] : []),
    [country, dpr],
  );
  const mask = useMemo(() => (country ? createHighlightTexture(country) : null), [country]);

  useEffect(() => {
    sceneUniforms.current = uniforms;
  }, [uniforms]);
  useEffect(() => {
    live.current.base = base;
    return () => disposeLines(base);
  }, [base]);
  useEffect(() => {
    live.current.highlight = highlight;
    live.current.mask = mask;
    live.current.level = 0;
    invalidate();
    return () => {
      disposeLines(highlight);
      mask?.dispose();
    };
  }, [highlight, mask, invalidate]);

  useFrame((state, delta) => {
    const current = live.current;
    const scene = sceneUniforms.current;
    const reveal = scene.uReveal.value;
    const level = current.mask ? easeTowards(current.level, 1, Math.min(delta, 1 / 20), FADE_RATE) : 0;
    const changed = level !== current.level;
    current.level = level;
    if (current.mask) scene.uHighlight.value = current.mask;
    scene.uHighlightLevel.value = level;
    fadeLines(current.base, reveal);
    fadeLines(current.highlight, reveal * level);
    if (changed) state.invalidate();
  });

  return (
    <>
      {base.map(({ lines }) => (
        <primitive key={lines.uuid} object={lines} />
      ))}
      {highlight.map(({ lines }) => (
        <primitive key={lines.uuid} object={lines} />
      ))}
    </>
  );
}
