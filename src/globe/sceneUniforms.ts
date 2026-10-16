import { Color, Vector3 } from 'three';

/** Uniform objects shared by every globe material, so one write updates all of them. */
export interface SceneUniforms {
  uSunDir: { value: Vector3 };
  uAtmosphere: { value: Color };
  uReveal: { value: number };
  /** 0 for the whole-globe view, 1 for the close-up; written by the driver each frame. */
  uZoom: { value: number };
}

/** Key light from the upper left and slightly in front; the lower right falls away softly. */
const SUN_DIRECTION = new Vector3(-0.58, 0.34, 0.74).normalize();

export function createSceneUniforms(): SceneUniforms {
  return {
    uSunDir: { value: SUN_DIRECTION.clone() },
    uAtmosphere: { value: new Color('#58b4f4') },
    uReveal: { value: 0 },
    uZoom: { value: 0 },
  };
}
