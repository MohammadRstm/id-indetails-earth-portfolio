/**
 * Where the globe sits inside the canvas, in CSS pixels. The page layout
 * decides this (an empty grid cell is measured); the scene frames the camera
 * to match. `version` changes on every update so the scene can react cheaply.
 */
export class GlobeLayout {
  centerX = 0;
  centerY = 0;
  diameter = 0;
  /** Size of the layout cell the globe is centred in; the close-up is composed against it. */
  frameWidth = 0;
  frameHeight = 0;
  version = 0;

  update(centerX: number, centerY: number, diameter: number, frameWidth: number, frameHeight: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    this.diameter = diameter;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.version += 1;
  }

  get ready(): boolean {
    return this.diameter > 0;
  }
}
