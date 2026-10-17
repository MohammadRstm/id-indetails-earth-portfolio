import { useEffect, useState } from 'react';
import { RedFormat, RepeatWrapping, TextureLoader, type Texture } from 'three';

export interface EarthTextures {
  /** Land/sea mask: 1 over water, 0 over land. */
  water: Texture;
}

export type EarthTextureState = { status: 'loading' } | { status: 'ready'; textures: EarthTextures } | { status: 'error' };

const TEXTURE_ROOT = '/textures';

/** The dot grid only samples the mask once per dot, so the 2K map is plenty on most screens. */
function waterMaskUrl(): string {
  const longestScreenEdge = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  return `${TEXTURE_ROOT}/earth-water-${longestScreenEdge >= 2400 ? '4k' : '2k'}.jpg`;
}

/**
 * Loads the land/sea mask outside React Suspense so failure can be shown in
 * the page. The texture is disposed when the globe unmounts.
 */
export function useEarthTextures(enabled: boolean): EarthTextureState {
  const [state, setState] = useState<EarthTextureState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let loaded: Texture | null = null;

    new TextureLoader()
      .loadAsync(waterMaskUrl())
      .then((water) => {
        if (cancelled) {
          water.dispose();
          return;
        }
        loaded = water;
        // One channel is enough on the GPU; repeating in longitude avoids a seam at the antimeridian.
        water.format = RedFormat;
        water.wrapS = RepeatWrapping;
        water.anisotropy = 4;
        setState({ status: 'ready', textures: { water } });
      })
      .catch((error: unknown) => {
        console.warn('Earth texture failed to load; showing the simplified globe.', error);
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      loaded?.dispose();
    };
  }, [enabled]);

  return state;
}
