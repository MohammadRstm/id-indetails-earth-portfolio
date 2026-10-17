/** How quickly the globe glides to a new layout cell (per second); about 0.9 s to settle. */
const GLIDE_RATE = 5;
const SETTLE_PX = 0.25;

interface Frame {
  centerX: number;
  centerY: number;
  diameter: number;
  frameWidth: number;
  frameHeight: number;
}

/**
 * Where the globe sits inside the canvas, in CSS pixels. The page layout
 * decides this (an empty grid cell is measured); the scene frames the camera
 * to match. When the cell moves, for example when the project page opens, the
 * globe glides there instead of jumping. `version` changes whenever the values
 * do, so the scene can react cheaply.
 */
export class GlobeLayout {
  centerX = 0;
  centerY = 0;
  diameter = 0;
  /** Size of the layout cell the globe is centred in; the close-up is composed against it. */
  frameWidth = 0;
  frameHeight = 0;
  version = 0;

  private target: Frame | null = null;

  update(centerX: number, centerY: number, diameter: number, frameWidth: number, frameHeight: number, instant = false): void {
    this.target = { centerX, centerY, diameter, frameWidth, frameHeight };
    if (instant || !this.ready) this.snap();
    this.version += 1;
  }

  /** Moves towards the latest measurement. Returns true while still gliding. */
  step(dt: number): boolean {
    const target = this.target;
    if (!target) return false;
    const t = 1 - Math.exp(-GLIDE_RATE * dt);
    let moving = false;
    for (const key of ['centerX', 'centerY', 'diameter', 'frameWidth', 'frameHeight'] as const) {
      const gap = target[key] - this[key];
      if (gap === 0) continue;
      this[key] = Math.abs(gap) < SETTLE_PX ? target[key] : this[key] + gap * t;
      moving = true;
    }
    if (moving) this.version += 1;
    return moving;
  }

  get ready(): boolean {
    return this.diameter > 0;
  }

  private snap(): void {
    if (this.target) Object.assign(this, this.target);
  }
}
