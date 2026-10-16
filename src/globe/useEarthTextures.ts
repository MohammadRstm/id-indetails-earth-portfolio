import { useEffect, useState } from 'react';
import { LoadingManager, RedFormat, SRGBColorSpace, TextureLoader, type Texture } from 'three';

export interface EarthTextures {
  day: Texture;
  lights: Texture;
  normal: Texture;
  water: Texture;
}

export type EarthTextureState =
  | { status: 'loading'; loaded: number; total: number }
  | { status: 'ready'; textures: EarthTextures }
  | { status: 'error' };

const TEXTURE_ROOT = '/textures';

/** The 4K day, normal and water maps are used only where the GPU and screen can make use of them. */
function prefersHighResolution(): boolean {
  const longestScreenEdge = Math.max(window.screen.width, window.screen.height) * (window.devicePixelRatio || 1);
  return longestScreenEdge >= 1600;
}

function textureUrls(): Record<keyof EarthTextures, string> {
  const size = prefersHighResolution() ? '4k' : '2k';
  return {
    day: `${TEXTURE_ROOT}/earth-day-${size}.jpg`,
    lights: `${TEXTURE_ROOT}/earth-lights-4k.jpg`,
    normal: `${TEXTURE_ROOT}/earth-normal-${size}.jpg`,
    water: `${TEXTURE_ROOT}/earth-water-${size}.jpg`,
  };
}

const TEXTURE_COUNT = 4;

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

    Promise.all([load(urls.day), load(urls.lights), load(urls.normal), load(urls.water)])
      .then(([day, lights, normal, water]) => {
        day.colorSpace = SRGBColorSpace;
        // Greyscale maps only need one channel on the GPU.
        lights.format = RedFormat;
        water.format = RedFormat;
        if (!cancelled) setState({ status: 'ready', textures: { day, lights, normal, water } });
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
