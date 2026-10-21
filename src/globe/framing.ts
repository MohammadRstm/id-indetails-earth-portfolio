import type { PerspectiveCamera } from 'three';
import type { GlobeLayout } from './GlobeLayout';

/** A slight axial lean, so the globe reads as a planet rather than a diagram. */
const AXIAL_ROLL = -0.13;
/**
 * In the close-up the globe leans so the focused place, which the controller
 * tips towards the top of the planet, points up and to the right: the planet
 * rises from the bottom-left corner with its edge running diagonally.
 */
const CLOSE_ROLL = -0.72;

/** The globe's lean for a zoom between 0 (whole globe) and 1 (close-up). */
export const rollFor = (zoom: number) => AXIAL_ROLL + (CLOSE_ROLL - AXIAL_ROLL) * zoom;

/**
 * Close-up composition, as fractions of the layout cell: the planet's radius
 * per cell height, and where its centre sits (below and left of the cell, so
 * only its upper-right edge shows).
 */
const CLOSE_RADIUS = 0.95;
const CLOSE_CENTER = { across: -0.15, down: 1.32 };
/** Phones: the cell is tall and narrow, so the planet sits further left and higher to keep the place on screen. */
const CLOSE_CENTER_NARROW = { across: -0.35, down: 1.18 };
const NARROW_FRAME_WIDTH = 600;
/**
 * Wide cells (the project page, with the globe beside its photo at half the screen's height): the planet sits
 * further right and higher, so it fills more of the cell and the place stays clear of the faded bottom edge.
 */
const CLOSE_CENTER_WIDE = { across: 0.3, down: 1.25 };
/** Cell width over height: at or below the first the tall placement is used, at or above the second the wide one, blended between. */
const WIDE_FROM_ASPECT = 1.1;
const WIDE_TO_ASPECT = 1.5;

/**
 * The placement for this cell's shape; it changes smoothly with the aspect, so the globe never jumps while the cell
 * glides. The phone placement is for a narrow cell that is also tall: the project page's half on a smaller laptop is
 * narrow too, but wide for its height.
 */
function closeCenter(layout: GlobeLayout) {
  const aspect = layout.frameWidth / layout.frameHeight;
  if (layout.frameWidth < NARROW_FRAME_WIDTH && aspect < WIDE_FROM_ASPECT) return CLOSE_CENTER_NARROW;
  const wide = Math.min(1, Math.max(0, (aspect - WIDE_FROM_ASPECT) / (WIDE_TO_ASPECT - WIDE_FROM_ASPECT)));
  return {
    across: CLOSE_CENTER.across + (CLOSE_CENTER_WIDE.across - CLOSE_CENTER.across) * wide,
    down: CLOSE_CENTER.down + (CLOSE_CENTER_WIDE.down - CLOSE_CENTER.down) * wide,
  };
}

/** Camera distance at which a unit sphere has a projected radius of `radiusPx`. */
const distanceForRadius = (focalPx: number, radiusPx: number) => Math.hypot(1, focalPx / radiusPx);

/**
 * Places the camera so the globe fills `layout.diameter` and centres it with a
 * lens shift. Zoomed in, the camera moves closer and the lens shift moves the
 * planet down and left, so it rises from the bottom-left corner of the cell
 * with the focused place near its edge. `zoom` blends between the two framings.
 */
export function frameCamera(camera: PerspectiveCamera, layout: GlobeLayout, zoom: number, width: number, height: number): void {
  if (!layout.ready || width === 0 || height === 0) return;
  const focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
  const overviewDistance = distanceForRadius(focal, layout.diameter / 2);
  const closeDistance = distanceForRadius(focal, CLOSE_RADIUS * layout.frameHeight);
  const centre = closeCenter(layout);
  const closeX = layout.centerX + (centre.across - 0.5) * layout.frameWidth;
  const closeY = layout.centerY + (centre.down - 0.5) * layout.frameHeight;

  const distance = overviewDistance ** (1 - zoom) * closeDistance ** zoom;
  const globeX = layout.centerX + (closeX - layout.centerX) * zoom;
  const globeY = layout.centerY + (closeY - layout.centerY) * zoom;

  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(width, height, width / 2 - globeX, height / 2 - globeY, width, height);
  camera.updateProjectionMatrix();
}
