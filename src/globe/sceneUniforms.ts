import { DataTexture, Vector3, type Texture } from 'three';

/** Uniform objects shared by every globe material, so one write updates all of them. */
export interface SceneUniforms {
  uSunDir: { value: Vector3 };
  uReveal: { value: number };
  /** The selected country's glow mask (see `createHighlightTexture`); black when none is selected. */
  uHighlight: { value: Texture };
  /** 0 to 1 as the glow fades in. */
  uHighlightLevel: { value: number };
}

/** Key light from the upper left and slightly in front; the lower right falls away softly. */
const SUN_DIRECTION = new Vector3(-0.58, 0.34, 0.74).normalize();

export function createSceneUniforms(): SceneUniforms {
  const none = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  none.needsUpdate = true;
  return {
    uSunDir: { value: SUN_DIRECTION.clone() },
    uReveal: { value: 0 },
    uHighlight: { value: none },
    uHighlightLevel: { value: 0 },
  };
}
