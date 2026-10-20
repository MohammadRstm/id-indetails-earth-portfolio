import { orientationFor, wrapAngle, type Orientation } from '../lib/geo';

const DEG = Math.PI / 180;
/** Full turn in roughly 140 seconds. */
const SPIN_SPEED = 0.045;
/** Seconds the spin takes to ease back up to full speed. */
const SPIN_RAMP_SECONDS = 2.5;
const HOLD_AFTER_FOCUS_SECONDS = 10;
const HOLD_AFTER_DRAG_SECONDS = 3.5;
const FOCUS_SMOOTH_TIME = 0.55;
/** A focus turn shorter than this gets a nudge, so a move between places close together still shows. */
const NUDGE_DISTANCE = 3 * DEG;
/**
 * The push such a turn starts with, in radians per second, in the direction of travel: it carries the globe
 * about a degree past the place before it settles back (less when zoomed in, where the surface is magnified).
 */
const NUDGE_SPEED = 0.3;
const INERTIA_DECAY = 3.2;
const MAX_DRAG_VELOCITY = 6;
export const PITCH_LIMIT = 60 * DEG;

const ZOOM_SMOOTH_TIME = 0.8;
/** While a focus turn has more than this left to travel, the camera stays pulled back. */
const ZOOM_OUT_DISTANCE = 0.45;
/** Angle, in radians, the focused place is tipped away from the planet's centre once fully zoomed in, towards its edge. */
export const ZOOM_PITCH_BIAS = 0.6;
/** How much a drag turns the globe less when fully zoomed in (the surface is larger on screen). */
const ZOOM_DRAG_DAMPING = 0.65;

interface DampResult {
  value: number;
  velocity: number;
}

/** Critically damped spring (as in Unity's SmoothDamp): no velocity jumps at the start or end. */
export function smoothDamp(current: number, target: number, velocity: number, smoothTime: number, dt: number): DampResult {
  const omega = 2 / Math.max(0.0001, smoothTime);
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (velocity + omega * change) * dt;
  return {
    velocity: (velocity - omega * temp) * decay,
    value: target + (change + temp) * decay,
  };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampPitch = (pitch: number) => Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
const easeInOutSine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

export interface FocusOptions {
  /** Jump straight to the location (used for reduced motion). */
  instant?: boolean;
  /** Seconds to stay still once the location is in view. */
  holdSeconds?: number;
}

export interface GlobeControllerOptions {
  autoRotate: boolean;
  reducedMotion: boolean;
}

/**
 * Owns the globe's orientation: automatic spin, drag with inertia, and smooth
 * focus transitions. Time is passed in (seconds) so the logic stays testable
 * and independent of the render loop.
 */
export class GlobeController {
  yaw: number;
  pitch: number;
  autoRotate: boolean;
  reducedMotion: boolean;

  private yawVelocity = 0;
  private pitchVelocity = 0;
  private target: Orientation | null = null;
  private dragging = false;
  private lastDragTime = 0;
  private holdUntil = 0;
  private hoverHold = false;
  private spinRamp = 0;
  private focusHold = HOLD_AFTER_FOCUS_SECONDS;
  private zoomValue = 0;
  private zoomVelocity = 0;
  private zoomTarget = 0;
  private closeUp = false;
  /** Extra tilt, in radians, that puts the focused place at ZOOM_PITCH_BIAS from the screen centre when zoomed in. */
  private zoomTilt = ZOOM_PITCH_BIAS;
  private wake: () => void = () => {};

  constructor(initial: Orientation, options: GlobeControllerOptions) {
    this.yaw = initial.yaw;
    this.pitch = initial.pitch;
    this.autoRotate = options.autoRotate;
    this.reducedMotion = options.reducedMotion;
  }

  /** Called whenever the globe needs frames again (used to restart an on-demand render loop). */
  setWakeHandler(handler: () => void): void {
    this.wake = handler;
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  get isTransitioning(): boolean {
    return this.target !== null;
  }

  /** 0 shows the whole globe, 1 is the close-up of the focused place (only while the close-up is on). */
  get zoom(): number {
    return this.zoomValue;
  }

  /** Radians the globe is tipped back by right now, so the focused place rises towards the top limb. */
  get tilt(): number {
    return this.zoomValue * this.zoomTilt;
  }

  /** Multiplier for drag distance: the surface is magnified when zoomed in. */
  get dragScale(): number {
    return 1 - ZOOM_DRAG_DAMPING * this.zoomValue;
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
    this.spinRamp = 0;
    this.holdUntil = 0;
    this.wake();
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  /**
   * Switches between the whole globe and the close-up of the focused place.
   * The camera moves in once the place has turned to face the viewer.
   */
  setCloseUp(enabled: boolean): void {
    this.closeUp = enabled;
    if (this.reducedMotion) {
      this.zoomValue = this.zoomTarget = enabled ? 1 : 0;
      this.zoomVelocity = 0;
    }
    this.wake();
  }

  /** Slows the spin to a stop while the pointer rests on a marker. */
  setHoverHold(hold: boolean): void {
    this.hoverHold = hold;
    this.wake();
  }

  /** Requests frames without changing anything, e.g. after a layout change. */
  requestFrame(): void {
    this.wake();
  }

  /**
   * Turns the globe so the location faces the viewer, then holds still for a
   * while before the automatic spin eases back in.
   */
  focus(lat: number, lng: number, now: number, options: FocusOptions = {}): void {
    const goal = orientationFor(lat, lng);
    const yaw = this.yaw + wrapAngle(goal.yaw - this.yaw);
    // orientationFor leaves high latitudes partly tilted, so the tilt makes up the difference.
    this.zoomTilt = ZOOM_PITCH_BIAS - (lat * DEG - goal.pitch);
    this.spinRamp = 0;
    this.dragging = false;
    this.focusHold = options.holdSeconds ?? HOLD_AFTER_FOCUS_SECONDS;
    if (options.instant || this.reducedMotion) {
      this.yaw = yaw;
      this.pitch = goal.pitch;
      this.yawVelocity = 0;
      this.pitchVelocity = 0;
      this.target = null;
      this.holdUntil = now + this.focusHold;
      this.zoomValue = this.closeUp ? 1 : 0;
      this.zoomVelocity = 0;
      this.zoomTarget = this.zoomValue;
    } else {
      this.nudge(yaw - this.yaw, goal.pitch - this.pitch);
      this.target = { yaw, pitch: goal.pitch };
    }
    this.wake();
  }

  /** Pushes a short turn on a little, so it sways past the place and settles back instead of barely moving. */
  private nudge(deltaYaw: number, deltaPitch: number): void {
    const distance = Math.hypot(deltaYaw, deltaPitch);
    if (distance < 1e-6 || distance >= NUDGE_DISTANCE) return;
    const push = NUDGE_SPEED * (1 - distance / NUDGE_DISTANCE) * this.dragScale;
    this.yawVelocity += (deltaYaw / distance) * push;
    this.pitchVelocity += (deltaPitch / distance) * push;
  }

  beginDrag(now: number): void {
    this.dragging = true;
    this.target = null;
    this.yawVelocity = 0;
    this.pitchVelocity = 0;
    this.spinRamp = 0;
    this.lastDragTime = now;
    this.wake();
  }

  /** Applies a drag step, in radians, measured over `dt` seconds. */
  dragBy(deltaYaw: number, deltaPitch: number, now: number): void {
    if (!this.dragging) return;
    const dt = Math.max(1 / 240, now - this.lastDragTime);
    this.yaw += deltaYaw;
    this.pitch = clampPitch(this.pitch + deltaPitch);
    const clampVelocity = (v: number) => Math.max(-MAX_DRAG_VELOCITY, Math.min(MAX_DRAG_VELOCITY, v));
    this.yawVelocity = clampVelocity(0.4 * this.yawVelocity + 0.6 * (deltaYaw / dt));
    this.pitchVelocity = clampVelocity(0.4 * this.pitchVelocity + 0.6 * (deltaPitch / dt));
    this.lastDragTime = now;
    this.wake();
  }

  endDrag(now: number): void {
    if (!this.dragging) return;
    this.dragging = false;
    // A pointer that stopped before release should not fling the globe.
    if (now - this.lastDragTime > 0.08 || this.reducedMotion) {
      this.yawVelocity = 0;
      this.pitchVelocity = 0;
    }
    this.holdUntil = now + HOLD_AFTER_DRAG_SECONDS;
    this.wake();
  }

  /** Advances the orientation and zoom. Returns true while further frames are needed. */
  update(dt: number, now: number): boolean {
    const turning = this.advanceOrientation(dt, now);
    this.updateZoomTarget();
    const zooming = this.advanceZoom(dt);
    return turning || zooming;
  }

  private updateZoomTarget(): void {
    if (!this.closeUp) {
      this.zoomTarget = 0;
    } else if (this.target) {
      const remaining = Math.hypot(this.target.yaw - this.yaw, this.target.pitch - this.pitch);
      this.zoomTarget = remaining > ZOOM_OUT_DISTANCE ? 0 : 1;
    } else {
      this.zoomTarget = 1;
    }
  }

  private advanceZoom(dt: number): boolean {
    const next = smoothDamp(this.zoomValue, this.zoomTarget, this.zoomVelocity, ZOOM_SMOOTH_TIME, dt);
    this.zoomValue = clamp01(next.value);
    this.zoomVelocity = this.zoomValue === next.value ? next.velocity : 0;
    if (Math.abs(this.zoomTarget - this.zoomValue) < 2e-3 && Math.abs(this.zoomVelocity) < 2e-3) {
      this.zoomValue = this.zoomTarget;
      this.zoomVelocity = 0;
      return false;
    }
    return true;
  }

  private advanceOrientation(dt: number, now: number): boolean {
    if (this.dragging) return true;
    let active = false;

    if (this.target) {
      const yaw = smoothDamp(this.yaw, this.target.yaw, this.yawVelocity, FOCUS_SMOOTH_TIME, dt);
      const pitch = smoothDamp(this.pitch, this.target.pitch, this.pitchVelocity, FOCUS_SMOOTH_TIME, dt);
      this.yaw = yaw.value;
      this.yawVelocity = yaw.velocity;
      this.pitch = pitch.value;
      this.pitchVelocity = pitch.velocity;
      const settled =
        Math.abs(this.target.yaw - this.yaw) < 1e-4 &&
        Math.abs(this.target.pitch - this.pitch) < 1e-4 &&
        Math.abs(this.yawVelocity) < 1e-3 &&
        Math.abs(this.pitchVelocity) < 1e-3;
      if (settled) {
        this.yaw = this.target.yaw;
        this.pitch = this.target.pitch;
        this.yawVelocity = 0;
        this.pitchVelocity = 0;
        this.target = null;
        this.holdUntil = now + this.focusHold;
      }
      active = true;
    } else if (Math.abs(this.yawVelocity) > 1e-4 || Math.abs(this.pitchVelocity) > 1e-4) {
      this.yaw += this.yawVelocity * dt;
      this.pitch = clampPitch(this.pitch + this.pitchVelocity * dt);
      const decay = Math.exp(-INERTIA_DECAY * dt);
      this.yawVelocity *= decay;
      this.pitchVelocity *= decay;
      if (Math.abs(this.yawVelocity) <= 1e-4) this.yawVelocity = 0;
      if (Math.abs(this.pitchVelocity) <= 1e-4) this.pitchVelocity = 0;
      active = true;
    }

    if (this.autoRotate && !this.target) {
      const holding = this.hoverHold || now < this.holdUntil;
      if (holding) {
        this.spinRamp = 0;
      } else {
        this.spinRamp = Math.min(1, this.spinRamp + dt / SPIN_RAMP_SECONDS);
        this.yaw += SPIN_SPEED * easeInOutSine(this.spinRamp) * dt;
      }
      active = true;
    }

    if (!this.target) this.yaw = wrapAngle(this.yaw);
    return active;
  }
}
