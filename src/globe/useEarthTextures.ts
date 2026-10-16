import { useEffect, useState } from 'react';
import { LoadingManager, SRGBColorSpace, TextureLoader, type Texture } from 'three';

export interface EarthTextures {
  day: Texture;
  lights: Texture;
  water: Texture;
  relief: Texture;
  clouds: Texture;
}

export type EarthTextureState =
  | { status: 'loading'; loaded: number; total: number }
  | { status: 'ready'; textures: EarthTextures }
  | { status: 'error' };

const TEXTURE_ROOT = '/textures';

/** The 4K day map is used only where the GPU and screen can make use of it. */
function prefersHighResolution(): boolean {
  const longestScreenEdge = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  return longestScreenEdge >= 1600;
}

function textureUrls(): Record<keyof EarthTextures, string> {
  return {
    day: `${TEXTURE_ROOT}/${prefersHighResolution() ? 'earth-day-4k.jpg' : 'earth-day-2k.jpg'}`,
    lights: `${TEXTURE_ROOT}/earth-lights-4k.jpg`,
    water: `${TEXTURE_ROOT}/earth-water-2k.jpg`,
    relief: `${TEXTURE_ROOT}/earth-relief-2k.jpg`,
    clouds: `${TEXTURE_ROOT}/earth-clouds-2k.jpg`,
  };
}

const TEXTURE_COUNT = 5;

/**
 * Loads the Earth maps outside React Suspense so progress and failure can be
 * shown in the page. Textures are disposed when the globe unmounts.
 */
export function useEarthTextures(enabled: boolean): EarthTextureState {
  const [state, setState] = useState<EarthTextureState>({ status: 'loading', loaded: 0, total: TEXTURE_COUNT });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const loaded: Texture[] = [];
    const manager = new LoadingManager();
    manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      if (!cancelled) setState({ status: 'loading', loaded: itemsLoaded, total: itemsTotal });
    };
    const loader = new TextureLoader(manager);
    const urls = textureUrls();
    const load = (url: string) =>
      loader.loadAsync(url).then((texture) => {
        loaded.push(texture);
        texture.anisotropy = 8;
        return texture;
      });

    Promise.all([load(urls.day), load(urls.lights), load(urls.water), load(urls.relief), load(urls.clouds)])
      .then(([day, lights, water, relief, clouds]) => {
        day.colorSpace = SRGBColorSpace;
        if (!cancelled) setState({ status: 'ready', textures: { day, lights, water, relief, clouds } });
      })
      .catch((error: unknown) => {
        console.warn('Earth textures failed to load; showing the simplified globe.', error);
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      loaded.forEach((texture) => texture.dispose());
    };
  }, [enabled]);

  return state;
}
