/**
 * How much the globe draws. A weak device (few processor cores, little memory,
 * or a visitor saving data) gets a lighter globe that looks the same at a
 * glance: no antialiasing, one pixel per CSS pixel, a coarser sphere, a
 * smaller land mask, fewer stars and no dust. The explorer also keeps it
 * still: no drifting strip and no ripples or route dashes, so the globe only
 * redraws when it turns. The map itself stays at 1:50m: at 1:110m a place on a
 * border river such as Brazzaville falls in the wrong country.
 */
export interface GlobeQuality {
  lowPower: boolean;
  /** The range of pixel ratios the canvas renders at. */
  dpr: [number, number];
  antialias: boolean;
  /** Width and height segments of the Earth's sphere. */
  sphereSegments: [number, number];
  stars: number;
  dust: boolean;
  /** Frames per second while only the ripples and route dashes move; turning and dragging run at the display's rate. */
  effectsFps: number;
  /** Widest land mask drawn, in pixels. */
  maxMaskWidth: number;
}

const FULL: GlobeQuality = {
  lowPower: false,
  dpr: [1, 1.5],
  antialias: true,
  sphereSegments: [192, 128],
  stars: 1100,
  dust: true,
  effectsFps: 30,
  maxMaskWidth: 4096,
};

const LOW: GlobeQuality = {
  lowPower: true,
  dpr: [1, 1],
  antialias: false,
  sphereSegments: [96, 64],
  stars: 600,
  dust: false,
  effectsFps: 20,
  maxMaskWidth: 2048,
};

export interface DeviceHints {
  /** `navigator.hardwareConcurrency`. */
  cores?: number;
  /** `navigator.deviceMemory`, in GB (Chromium only, rounded and capped at 8). */
  memory?: number;
  /** The visitor asked their browser to save data. */
  saveData?: boolean;
  /** `?globe=low` or `?globe=high` in the address, to try either on any device. */
  override?: string | null;
}

export function isLowPower({ cores, memory, saveData }: DeviceHints): boolean {
  if (saveData) return true;
  if (cores !== undefined && cores <= 4) return true;
  return memory !== undefined && memory <= 4;
}

export function globeQuality(hints: DeviceHints = readDeviceHints()): GlobeQuality {
  if (hints.override === 'low') return LOW;
  if (hints.override === 'high') return FULL;
  return isLowPower(hints) ? LOW : FULL;
}

function readDeviceHints(): DeviceHints {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return {
    cores: nav.hardwareConcurrency || undefined,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    override: new URLSearchParams(window.location.search).get('globe'),
  };
}
