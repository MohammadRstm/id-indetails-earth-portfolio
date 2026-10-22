import { useEffect, useState } from 'react';
import { CanvasTexture, RepeatWrapping, type Texture } from 'three';
import { decodeCountries, unwrapRing, type CountriesTopology, type CountryData, type CountryShape } from '../lib/countries';
import { loadCountryTopology } from './preload';
import type { GlobeQuality } from './quality';

export interface CountryAssets {
  data: CountryData;
  /** Land mask: white over land, transparent over the sea, in equirectangular projection. */
  land: Texture;
}

export type CountryState = { status: 'loading' } | { status: 'ready'; assets: CountryAssets } | { status: 'error' };

/** A large mask only where the screen can show it; the land edge is softened by filtering either way. */
function maskWidth(maxWidth: number): number {
  const longestScreenEdge = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  return Math.min(maxWidth, longestScreenEdge >= 2000 ? 4096 : 2048);
}

function createCanvas(width: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 2;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D canvas unavailable');
  return { canvas, context };
}

/** Fills countries in the current fill style, in equirectangular projection, repeating rings that cross the antimeridian on both sides. */
function fillCountries(context: CanvasRenderingContext2D, countries: CountryShape[]): void {
  const { width, height } = context.canvas;
  const x = (lng: number) => ((lng + 180) / 360) * width;
  const y = (lat: number) => ((90 - lat) / 180) * height;

  for (const country of countries) {
    for (const polygon of country.polygons) {
      const rings = polygon.map(unwrapRing);
      const lngs = rings[0].map(([lng]) => lng);
      const shifts = [0, -360, 360].filter((shift) => Math.max(...lngs) + shift > -180 && Math.min(...lngs) + shift < 180);
      for (const shift of shifts) {
        context.beginPath();
        for (const ring of rings) {
          ring.forEach(([lng, lat], index) => {
            if (index === 0) context.moveTo(x(lng + shift), y(lat));
            else context.lineTo(x(lng + shift), y(lat));
          });
          context.closePath();
        }
        context.fill('evenodd');
      }
    }
  }
}

function drawLandMask(countries: CountryShape[], width: number): HTMLCanvasElement {
  const { canvas, context } = createCanvas(width);
  context.fillStyle = '#fff';
  fillCountries(context, countries);
  return canvas;
}

/** Small on purpose: it is redrawn whenever the selected country changes, and filtering smooths it on the globe. */
const HIGHLIGHT_WIDTH = 512;
/** How far the glow spreads either side of the border, in mask pixels (about 1.4° of longitude). */
const HIGHLIGHT_BLUR_PX = 2;

/** Drawn masks by country id, so going back to a country costs nothing. */
const highlightMasks = new Map<string, HTMLCanvasElement>();

function drawHighlightMask(country: CountryShape): HTMLCanvasElement {
  const { canvas, context } = createCanvas(HIGHLIGHT_WIDTH);
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'lighter';
  context.filter = `blur(${HIGHLIGHT_BLUR_PX}px)`;
  context.fillStyle = '#0f0';
  fillCountries(context, [country]);
  context.filter = 'none';
  context.fillStyle = '#f00';
  fillCountries(context, [country]);
  return canvas;
}

/**
 * One country as a texture for the border glow: red is the country itself,
 * green is the same shape blurred, so the shader can find a soft band along
 * the border without drawing overlapping lines.
 */
export function createHighlightTexture(country: CountryShape): Texture {
  let canvas = highlightMasks.get(country.id);
  if (!canvas) {
    canvas = drawHighlightMask(country);
    highlightMasks.set(country.id, canvas);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  return texture;
}

/**
 * Loads the Natural Earth country outlines (public domain, via `world-atlas`)
 * outside React Suspense so failure can be shown in the page, and draws the
 * land mask the globe is shaded from. The texture is disposed on unmount.
 * A low-power device gets a smaller mask.
 */
export function useCountryData(enabled: boolean, { maxMaskWidth }: GlobeQuality): CountryState {
  const [state, setState] = useState<CountryState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let land: Texture | null = null;

    loadCountryTopology()
      .then((topology) => {
        if (cancelled) return;
        const data = decodeCountries(topology as CountriesTopology);
        land = new CanvasTexture(drawLandMask(data.countries, maskWidth(maxMaskWidth)));
        land.wrapS = RepeatWrapping;
        land.anisotropy = 4;
        setState({ status: 'ready', assets: { data, land } });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('Country outlines failed to load; showing the simplified globe.', error);
        setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      land?.dispose();
    };
  }, [enabled, maxMaskWidth]);

  return state;
}
