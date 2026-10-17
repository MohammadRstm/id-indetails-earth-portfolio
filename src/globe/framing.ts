import type { PerspectiveCamera } from 'three';
import { ZOOM_PITCH_BIAS } from './GlobeController';
import type { GlobeLayout } from './GlobeLayout';

/** A slight axial lean, so the globe reads as a planet rather than a diagram. */
export const AXIAL_ROLL = -0.13;

/** Close-up composition, as fractions of the layout cell: globe radius per cell height, and where the place sits. */
const CLOSE_RADIUS_DESKTOP = 1.4;
const CLOSE_RADIUS_NARROW = 1.15;
const NARROW_FRAME_WIDTH = 600;
const PLACE_DOWN_FRACTION = 0.47;

/** Camera distance at which a unit sphere has a projected radius of `radiusPx`. */
const distanceForRadius = (focalPx: number, radiusPx: number) => Math.hypot(1, focalPx / radiusPx);

/**
 * Places the camera so the globe fills `layout.diameter` and centres it with a
 * lens shift. Zoomed in, the camera moves closer and the lens shift lowers the
 * globe so the focused place sits in the middle of the cell with the horizon
 * curving across the top. `zoom` blends between the two framings.
 */
export function frameCamera(camera: PerspectiveCamera, layout: GlobeLayout, zoom: number, width: number, height: number): void {
  if (!layout.ready || width === 0 || height === 0) return;
  const focal = height / 2 / Math.tan((camera.fov * Math.PI) / 360);
  const overviewDistance = distanceForRadius(focal, layout.diameter / 2);

  const closeRadius = (layout.frameWidth < NARROW_FRAME_WIDTH ? CLOSE_RADIUS_NARROW : CLOSE_RADIUS_DESKTOP) * layout.frameHeight;
  const closeDistance = distanceForRadius(focal, closeRadius);
  // The place sits ZOOM_PITCH_BIAS off the screen centre, then the axial roll swings it sideways.
  const placeOffset = (focal * Math.sin(ZOOM_PITCH_BIAS)) / (closeDistance - Math.cos(ZOOM_PITCH_BIAS));
  const placeY = layout.centerY + (PLACE_DOWN_FRACTION - 0.5) * layout.frameHeight;
  const closeX = layout.centerX + placeOffset * Math.sin(AXIAL_ROLL);
  const closeY = placeY + placeOffset * Math.cos(AXIAL_ROLL);

  const distance = overviewDistance ** (1 - zoom) * closeDistance ** zoom;
  const globeX = layout.centerX + (closeX - layout.centerX) * zoom;
  const globeY = layout.centerY + (closeY - layout.centerY) * zoom;

  camera.position.set(0, 0, distance);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(width, height, width / 2 - globeX, height / 2 - globeY, width, height);
  camera.updateProjectionMatrix();
}
