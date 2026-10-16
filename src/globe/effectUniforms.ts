import type { ShaderMaterial } from 'three';

/** Time and motion state shared by the beacons and routes, written once per frame by the driver. */
export interface EffectUniforms {
  /** Seconds of animation played; stops advancing whenever motion is off. */
  uTime: { value: number };
  /** 1 while pulses and flows may run (rotation on, reduced motion off), otherwise 0. */
  uAnimate: { value: number };
}

export function createEffectUniforms(): EffectUniforms {
  return { uTime: { value: 0 }, uAnimate: { value: 1 } };
}

/** Moves `current` towards `target`, independent of the frame rate. */
export function easeTowards(current: number, target: number, dt: number, rate: number): number {
  const next = current + (target - current) * (1 - Math.exp(-rate * dt));
  return Math.abs(target - next) < 0.002 ? target : next;
}

/** Writes a numeric uniform; the frame loops use this so React's lint rules see no render-time mutation. */
export function setUniform(material: ShaderMaterial, name: string, value: number): void {
  material.uniforms[name].value = value;
}
