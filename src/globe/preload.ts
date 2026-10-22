import countriesUrl from 'world-atlas/countries-50m.json?url';
import { isWebGL2Available } from '../lib/webgl';
import { globeQuality, type GlobeQuality } from './quality';

/*
 * The globe's code (three.js, most of the site's code) and its map load on
 * their own, after the site's code. A page that opens on the globe asks for
 * both straight away, alongside the site's data, rather than only once the
 * projects have arrived; other pages leave them until the globe is shown.
 */

export type GlobeStageModule = typeof import('./GlobeStage');

let stage: Promise<GlobeStageModule> | null = null;

/** The globe's code, fetched once; a failed download is tried again on the next ask. */
export function loadGlobeStage(): Promise<GlobeStageModule> {
  stage ??= import('./GlobeStage').catch((error: unknown) => {
    stage = null;
    throw error;
  });
  return stage;
}

let topology: Promise<unknown> | null = null;

/** The Natural Earth country outlines as TopoJSON, fetched once; a failed download is tried again on the next ask. */
export function loadCountryTopology(): Promise<unknown> {
  topology ??= fetch(countriesUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Country outlines responded ${response.status}`);
      return response.json() as Promise<unknown>;
    })
    .catch((error: unknown) => {
      topology = null;
      throw error;
    });
  return topology;
}

let quality: GlobeQuality | null = null;

/** Decided once, on the first ask, while a ?globe= override is still in the address (the grid rewrites the query). */
export function siteGlobeQuality(): GlobeQuality {
  quality ??= globeQuality();
  return quality;
}

export function preloadGlobe(): void {
  if (!isWebGL2Available()) return;
  loadGlobeStage().catch(() => {});
  loadCountryTopology().catch(() => {});
}
