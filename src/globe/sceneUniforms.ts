import { Color, Vector3 } from 'three';

/** Uniform objects shared by every globe material, so one write updates all of them. */
export interface SceneUniforms {
  uSunDir: { value: Vector3 };
  uAtmosphere: { value: Color };
  uReveal: { value: number };
}

/** Light from the upper left and slightly in front, leaving a night crescent on the right limb. */
const SUN_DIRECTION = new Vector3(-0.58, 0.34, 0.74).normalize();

export function createSceneUniforms(): SceneUniforms {
  return {
    uSunDir: { value: SUN_DIRECTION.clone() },
    uAtmosphere: { value: new Color('#5cbcff') },
    uReveal: { value: 0 },
  };
}
