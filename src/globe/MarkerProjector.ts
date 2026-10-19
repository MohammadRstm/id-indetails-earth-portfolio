import { Vector3, type Camera, type Object3D } from 'three';
import { latLngToVector } from '../lib/geo';

/** Matches the markers' height above the surface. */
const MARKER_ALTITUDE = 1.004;

interface MarkerEntry {
  local: Vector3;
  element: HTMLElement | null;
  visible: boolean;
}

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Projects geographic markers from the rotating globe onto DOM elements once
 * per rendered frame, writing styles directly so React never re-renders for
 * motion. Markers past the horizon fade out and leave the accessibility tree.
 */
export class MarkerProjector {
  private entries = new Map<string, MarkerEntry>();
  private world = new Vector3();
  private toCamera = new Vector3();
  private normal = new Vector3();

  register(id: string, lat: number, lng: number, element: HTMLElement): void {
    const { x, y, z } = latLngToVector(lat, lng, MARKER_ALTITUDE);
    this.entries.set(id, { local: new Vector3(x, y, z), element, visible: true });
  }

  unregister(id: string): void {
    this.entries.delete(id);
  }

  update(camera: Camera, globe: Object3D, width: number, height: number): void {
    globe.updateWorldMatrix(true, false);

    for (const entry of this.entries.values()) {
      const { element } = entry;
      if (!element) continue;
      this.world.copy(entry.local).applyMatrix4(globe.matrixWorld);
      this.normal.copy(this.world).normalize();
      this.toCamera.copy(camera.position).sub(this.world).normalize();
      const facing = this.normal.dot(this.toCamera);
      const opacity = smoothstep(0.03, 0.24, facing);
      const visible = opacity > 0.04;

      this.world.project(camera);
      const x = (this.world.x * 0.5 + 0.5) * width;
      const y = (-this.world.y * 0.5 + 0.5) * height;
      const scale = 0.72 + 0.28 * Math.max(0, facing);
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      element.style.opacity = opacity.toFixed(3);
      if (visible !== entry.visible) {
        entry.visible = visible;
        element.dataset.visible = String(visible);
      }
    }
  }
}
