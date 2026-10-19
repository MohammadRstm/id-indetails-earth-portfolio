import { describe, expect, it, vi } from 'vitest';
import { Euler, Vector3 } from 'three';
import { latLngToVector, orientationFor, wrapAngle } from '../lib/geo';
import { GlobeController, PITCH_LIMIT, smoothDamp, ZOOM_PITCH_BIAS } from './GlobeController';

const FRAME = 1 / 60;
const DEG = Math.PI / 180;

function createController(
  options: { autoRotate?: boolean; reducedMotion?: boolean; closeUp?: boolean; yaw?: number; pitch?: number } = {},
) {
  const controller = new GlobeController(
    { yaw: options.yaw ?? 0, pitch: options.pitch ?? 0 },
    { autoRotate: options.autoRotate ?? false, reducedMotion: options.reducedMotion ?? false },
  );
  if (options.closeUp) controller.setCloseUp(true);
  return controller;
}

/** Steps the controller at 60 fps until `now` reaches `until`; returns the new time. */
function advance(controller: GlobeController, from: number, until: number): number {
  let now = from;
  while (now < until - 1e-9) {
    now += FRAME;
    controller.update(FRAME, now);
  }
  return now;
}

/** Steps until the controller stops asking for frames. Fails if it never does. */
function runUntilIdle(controller: GlobeController, from: number, maxSeconds = 20): number {
  let now = from;
  const limit = from + maxSeconds;
  while (now < limit) {
    now += FRAME;
    if (!controller.update(FRAME, now)) return now;
  }
  throw new Error(`Controller still active after ${maxSeconds} seconds`);
}

/** Total yaw covered until the controller goes idle; a full-turn wrap counts as no movement. */
function yawTravelUntilIdle(controller: GlobeController, maxSeconds = 10): number {
  let now = 0;
  let travelled = 0;
  let previousYaw = controller.yaw;
  while (now < maxSeconds) {
    now += FRAME;
    if (!controller.update(FRAME, now)) return travelled;
    travelled += Math.abs(wrapAngle(controller.yaw - previousYaw));
    previousYaw = controller.yaw;
  }
  throw new Error('Controller still active after ' + maxSeconds + ' seconds');
}

describe('smoothDamp', () => {
  it('converges on the target without overshooting', () => {
    let value = 0;
    let velocity = 0;
    let previous = value;
    for (let frame = 0; frame < 600; frame++) {
      ({ value, velocity } = smoothDamp(value, 1, velocity, 0.5, FRAME));
      expect(value).toBeLessThanOrEqual(1 + 1e-9);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-12);
      previous = value;
    }
    expect(value).toBeCloseTo(1, 6);
    expect(velocity).toBeCloseTo(0, 6);
  });

  it('converges downwards too', () => {
    let value = 2;
    let velocity = 0;
    for (let frame = 0; frame < 600; frame++) {
      ({ value, velocity } = smoothDamp(value, -1, velocity, 0.4, FRAME));
      expect(value).toBeGreaterThanOrEqual(-1 - 1e-9);
    }
    expect(value).toBeCloseTo(-1, 6);
  });

  it('starts gently: the first step is much smaller than the distance', () => {
    const { value, velocity } = smoothDamp(0, 1, 0, 0.55, FRAME);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThan(0.01);
    expect(velocity).toBeGreaterThan(0);
  });

  it('does not move when no time has passed', () => {
    const result = smoothDamp(0.3, 1, 0.2, 0.5, 0);
    expect(result.value).toBeCloseTo(0.3);
    expect(result.velocity).toBeCloseTo(0.2);
  });

  it('stays stable for a long frame', () => {
    const { value } = smoothDamp(0, 1, 0, 0.5, 1);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThanOrEqual(1);
  });
});

describe('focus', () => {
  it('turns to the location, settles and stops asking for frames', () => {
    const controller = createController();
    const goal = orientationFor(38.7223, -9.1393);
    controller.focus(38.7223, -9.1393, 0);
    expect(controller.isTransitioning).toBe(true);

    const finished = runUntilIdle(controller, 0, 10);

    expect(controller.isTransitioning).toBe(false);
    expect(finished).toBeLessThan(9);
    expect(wrapAngle(controller.yaw - goal.yaw)).toBeCloseTo(0, 4);
    expect(controller.pitch).toBeCloseTo(goal.pitch, 4);
    // Without the close-up the whole globe stays in view.
    expect(controller.zoom).toBe(0);
  });

  it('keeps asking for frames while the transition is running', () => {
    const controller = createController();
    controller.focus(35, 139, 0);
    expect(controller.update(FRAME, FRAME)).toBe(true);
    expect(controller.update(FRAME, 2 * FRAME)).toBe(true);
  });

  it('takes the shortest way round in yaw', () => {
    // Goal yaw is -3 rad while the globe sits at +3 rad: the short way is +0.28 rad through PI.
    const lng = 3 / DEG - 90;
    const goal = orientationFor(0, lng);
    expect(goal.yaw).toBeCloseTo(-3);

    const controller = createController({ yaw: 3 });
    controller.focus(0, lng, 0);

    expect(yawTravelUntilIdle(controller)).toBeCloseTo(2 * Math.PI - 6, 3);
    expect(wrapAngle(controller.yaw - goal.yaw)).toBeCloseTo(0, 4);
  });

  it('takes the shortest way round in the other direction', () => {
    // Goal yaw is +3 rad while the globe sits at -3.1 rad: the short way is -0.18 rad through -PI.
    const lng = -3 / DEG - 90;
    const goal = orientationFor(0, lng);
    expect(goal.yaw).toBeCloseTo(3);

    const controller = createController({ yaw: -3.1 });
    controller.focus(0, lng, 0);

    expect(yawTravelUntilIdle(controller)).toBeCloseTo(2 * Math.PI - 6.1, 3);
    expect(wrapAngle(controller.yaw - goal.yaw)).toBeCloseTo(0, 4);
  });

  it('holds still after settling, then the spin resumes', () => {
    const controller = createController({ autoRotate: true, yaw: 0.2 });
    controller.focus(0, 0, 0, { holdSeconds: 2 });

    // Run until the transition has finished.
    let now = 0;
    while (controller.isTransitioning && now < 10) {
      now += FRAME;
      controller.update(FRAME, now);
    }
    expect(controller.isTransitioning).toBe(false);
    const settledAt = now;
    const settledYaw = controller.yaw;

    // Still, and still asking for frames so the end of the hold is noticed.
    now = advance(controller, now, settledAt + 1.9);
    expect(controller.yaw).toBeCloseTo(settledYaw, 9);
    expect(controller.update(FRAME, now + FRAME)).toBe(true);

    // After the hold the spin eases in.
    advance(controller, now, settledAt + 2 + 3);
    expect(wrapAngle(controller.yaw - settledYaw)).toBeGreaterThan(0.03);
  });

  it('does not spin while the pointer rests on a marker, and resumes afterwards', () => {
    const controller = createController({ autoRotate: true });
    controller.setHoverHold(true);
    const now = advance(controller, 0, 3);
    expect(controller.yaw).toBeCloseTo(0, 9);

    controller.setHoverHold(false);
    advance(controller, now, now + 3);
    expect(controller.yaw).toBeGreaterThan(0.03);
  });

  it('jumps straight to the location with reduced motion', () => {
    const controller = createController({ reducedMotion: true, yaw: 2 });
    const goal = orientationFor(-37.8136, 144.9631);
    controller.focus(-37.8136, 144.9631, 0);

    expect(controller.isTransitioning).toBe(false);
    expect(wrapAngle(controller.yaw - goal.yaw)).toBeCloseTo(0, 9);
    expect(controller.pitch).toBeCloseTo(goal.pitch, 9);
    expect(controller.update(FRAME, FRAME)).toBe(false);
  });

  it('jumps straight to the location when asked to be instant', () => {
    const controller = createController({ yaw: -2 });
    const goal = orientationFor(45.5, -73.6);
    controller.focus(45.5, -73.6, 0, { instant: true });

    expect(controller.isTransitioning).toBe(false);
    expect(wrapAngle(controller.yaw - goal.yaw)).toBeCloseTo(0, 9);
    expect(controller.pitch).toBeCloseTo(goal.pitch, 9);
  });

  it('wakes the render loop', () => {
    const controller = createController();
    const wake = vi.fn();
    controller.setWakeHandler(wake);
    controller.focus(10, 10, 0);
    expect(wake).toHaveBeenCalled();
  });
});

describe('auto-rotation', () => {
  it('spins, easing in from a standstill', () => {
    const controller = createController({ autoRotate: true });
    controller.update(FRAME, FRAME);
    const early = controller.yaw;
    expect(early).toBeGreaterThan(0);

    advance(controller, FRAME, 1);
    const afterOneSecond = controller.yaw;
    expect(afterOneSecond).toBeGreaterThan(early);
    // The spin is still ramping up, so the next second covers more ground than the first.
    advance(controller, 1, 2);
    expect(controller.yaw - afterOneSecond).toBeGreaterThan(afterOneSecond);
  });

  it('stops when switched off and the controller goes idle', () => {
    const controller = createController({ autoRotate: true });
    const now = advance(controller, 0, 1);
    expect(controller.yaw).toBeGreaterThan(0);

    controller.setAutoRotate(false);
    const yawAtStop = controller.yaw;
    const idleAt = runUntilIdle(controller, now, 5);

    expect(controller.update(FRAME, idleAt + FRAME)).toBe(false);
    advance(controller, idleAt, idleAt + 2);
    expect(controller.yaw).toBeCloseTo(yawAtStop, 9);
  });

  it('reports idle straight away when there is nothing to animate', () => {
    expect(createController().update(FRAME, FRAME)).toBe(false);
  });

  it('starts from a standstill when switched back on', () => {
    const controller = createController({ autoRotate: true });
    let now = advance(controller, 0, 3);
    controller.setAutoRotate(false);
    runUntilIdle(controller, now);
    const yaw = controller.yaw;

    controller.setAutoRotate(true);
    now += FRAME;
    controller.update(FRAME, now);
    expect(controller.yaw - yaw).toBeGreaterThan(0);
    // First frame of the ramp: far slower than full speed (0.045 rad/s).
    expect(controller.yaw - yaw).toBeLessThan(0.045 * FRAME * 0.1);
  });

  it('wakes the render loop when toggled', () => {
    const controller = createController();
    const wake = vi.fn();
    controller.setWakeHandler(wake);
    controller.setAutoRotate(true);
    expect(wake).toHaveBeenCalledTimes(1);
  });
});

describe('dragging', () => {
  /** A quick two-step swipe, 0.04 rad in total, released at once. */
  function swipe(controller: GlobeController): number {
    controller.beginDrag(0);
    controller.dragBy(0.02, 0, 0.016);
    controller.dragBy(0.02, 0, 0.032);
    controller.endDrag(0.034);
    return 0.034;
  }

  it('moves the globe directly while dragging and stays active', () => {
    const controller = createController();
    controller.beginDrag(0);
    expect(controller.isDragging).toBe(true);
    controller.dragBy(0.1, 0.05, 0.016);
    expect(controller.yaw).toBeCloseTo(0.1);
    expect(controller.pitch).toBeCloseTo(0.05);
    expect(controller.update(FRAME, 0.02)).toBe(true);
    expect(controller.yaw).toBeCloseTo(0.1);
  });

  it('ignores drag steps when no drag has begun', () => {
    const controller = createController();
    controller.dragBy(0.5, 0.5, 0.1);
    expect(controller.yaw).toBe(0);
    expect(controller.pitch).toBe(0);
  });

  it('clamps the pitch', () => {
    const controller = createController();
    controller.beginDrag(0);
    controller.dragBy(0, 10, 0.016);
    expect(controller.pitch).toBeCloseTo(PITCH_LIMIT);
    controller.dragBy(0, -20, 0.032);
    expect(controller.pitch).toBeCloseTo(-PITCH_LIMIT);
  });

  it('cancels a transition in progress', () => {
    const controller = createController();
    controller.focus(40, 40, 0);
    expect(controller.isTransitioning).toBe(true);
    controller.beginDrag(0.1);
    expect(controller.isTransitioning).toBe(false);
  });

  it('keeps moving after a quick release, then decays to a stop', () => {
    const controller = createController();
    let now = swipe(controller);
    expect(controller.yaw).toBeCloseTo(0.04);

    const deltas: number[] = [];
    let previousYaw = controller.yaw;
    let idle = false;
    for (let frame = 0; frame < 600 && !idle; frame++) {
      now += FRAME;
      idle = !controller.update(FRAME, now);
      deltas.push(controller.yaw - previousYaw);
      previousYaw = controller.yaw;
    }

    expect(idle).toBe(true);
    expect(deltas[0]).toBeGreaterThan(0);
    // Each frame moves a little less than the last (exponential decay).
    for (let i = 1; i < deltas.length; i++) expect(deltas[i]).toBeLessThanOrEqual(deltas[i - 1] + 1e-12);
    const fling = controller.yaw - 0.04;
    expect(fling).toBeGreaterThan(0.1);
    expect(fling).toBeLessThan(1);
  });

  it('does not fling when the pointer paused before release', () => {
    const controller = createController();
    controller.beginDrag(0);
    controller.dragBy(0.02, 0, 0.016);
    controller.dragBy(0.02, 0, 0.032);
    controller.endDrag(0.2);

    expect(controller.update(FRAME, 0.22)).toBe(false);
    advance(controller, 0.22, 2);
    expect(controller.yaw).toBeCloseTo(0.04, 9);
  });

  it('does not fling with reduced motion', () => {
    const controller = createController({ reducedMotion: true });
    swipe(controller);
    expect(controller.update(FRAME, 0.05)).toBe(false);
    expect(controller.yaw).toBeCloseTo(0.04, 9);
  });

  it('pauses the auto-rotation after a drag, then lets it return', () => {
    const controller = createController({ autoRotate: true });
    controller.beginDrag(0);
    controller.dragBy(0.1, 0, 0.5);
    controller.endDrag(1);
    const releasedYaw = controller.yaw;

    // Pointer rested before release: no fling, and no spin during the pause.
    const now = advance(controller, 1, 3);
    expect(controller.yaw).toBeCloseTo(releasedYaw, 9);

    advance(controller, now, 15);
    expect(controller.yaw).toBeGreaterThan(releasedYaw + 0.05);
  });
});

describe('zoom', () => {
  it('starts zoomed out and idle', () => {
    const controller = createController();
    expect(controller.zoom).toBe(0);
    expect(controller.tilt).toBe(0);
    expect(controller.dragScale).toBe(1);
    expect(controller.update(FRAME, FRAME)).toBe(false);
  });

  it('stays out while a far turn is under way, then moves in once the place is close', () => {
    const goal = orientationFor(0, 0);
    const controller = createController({ closeUp: true, yaw: goal.yaw + 2 });
    controller.focus(0, 0, 0);

    let now = advance(controller, 0, 0.3);
    expect(controller.zoom).toBeLessThan(0.05);

    let zoomedInWhileFarAway = false;
    while (controller.isTransitioning && now < 10) {
      now += FRAME;
      controller.update(FRAME, now);
      const remaining = Math.abs(wrapAngle(controller.yaw - goal.yaw));
      if (remaining > 0.5 && controller.zoom > 0.5) zoomedInWhileFarAway = true;
    }
    expect(zoomedInWhileFarAway).toBe(false);

    runUntilIdle(controller, now);
    expect(controller.zoom).toBe(1);
  });

  it('heads straight in when the place is already close', () => {
    const controller = createController({ closeUp: true, yaw: orientationFor(0, 0).yaw + 0.2 });
    controller.focus(0, 0, 0);
    advance(controller, 0, 0.5);
    expect(controller.zoom).toBeGreaterThan(0.3);
  });

  it('eases out for a distant place and back in again', () => {
    const controller = createController({ closeUp: true });
    controller.focus(0, 0, 0, { instant: true });
    expect(controller.zoom).toBe(1);

    controller.focus(0, 120, 0);
    let now = 0;
    let lowest = 1;
    let rising = false;
    while (now < 12) {
      now += FRAME;
      const active = controller.update(FRAME, now);
      if (controller.zoom < lowest) lowest = controller.zoom;
      else if (controller.zoom > lowest + 0.05) rising = true;
      if (!active) break;
    }
    expect(lowest).toBeLessThan(0.5);
    expect(rising).toBe(true);
    expect(controller.zoom).toBe(1);
  });

  it('keeps asking for frames while the zoom is still moving, then goes idle', () => {
    const controller = createController({ closeUp: true });
    controller.focus(0, 0, 0, { instant: true });
    controller.focus(0, 150, 1);
    expect(controller.update(FRAME, 1 + FRAME)).toBe(true);
    const settledAt = runUntilIdle(controller, 1 + FRAME);
    expect(controller.update(FRAME, settledAt + FRAME)).toBe(false);
  });

  it('never moves in while the close-up is off', () => {
    const controller = createController({ autoRotate: true });
    controller.focus(0, 0, 0, { instant: true });
    expect(controller.zoom).toBe(0);
    controller.focus(30, 90, 0);
    let now = 0;
    let highest = 0;
    while (now < 12) {
      now += FRAME;
      controller.update(FRAME, now);
      highest = Math.max(highest, controller.zoom);
    }
    expect(highest).toBe(0);
  });

  it('moves in when the close-up is switched on, and back out when it is switched off', () => {
    const controller = createController();
    controller.focus(0, 0, 0, { instant: true });
    controller.setCloseUp(true);
    const inAt = runUntilIdle(controller, 0);
    expect(controller.zoom).toBe(1);

    controller.setCloseUp(false);
    expect(controller.update(FRAME, inAt + FRAME)).toBe(true);
    runUntilIdle(controller, inAt + FRAME);
    expect(controller.zoom).toBe(0);
  });

  it('switches the close-up straight in and out with reduced motion', () => {
    const controller = createController({ reducedMotion: true });
    controller.setCloseUp(true);
    expect(controller.zoom).toBe(1);
    controller.setCloseUp(false);
    expect(controller.zoom).toBe(0);
  });

  it('keeps its zoom with rotation off', () => {
    const controller = createController({ closeUp: true, autoRotate: false });
    controller.focus(40, 10, 0);
    const idleAt = runUntilIdle(controller, 0);
    expect(controller.zoom).toBe(1);

    advance(controller, idleAt, idleAt + 30);
    expect(controller.zoom).toBe(1);
    expect(controller.update(FRAME, idleAt + 30 + FRAME)).toBe(false);
  });

  it('keeps a zoomed view when rotation is switched off during the hold', () => {
    const controller = createController({ closeUp: true, autoRotate: true });
    controller.focus(0, 0, 0, { instant: true });
    controller.setAutoRotate(false);
    advance(controller, 0, 30);
    expect(controller.zoom).toBe(1);
  });

  it('jumps in with reduced motion', () => {
    const controller = createController({ closeUp: true, reducedMotion: true });
    controller.focus(10, 20, 0);
    expect(controller.zoom).toBe(1);
  });

  it('keeps easing, back towards the close-up, while the globe is being dragged', () => {
    const controller = createController({ closeUp: true });
    controller.focus(0, 0, 0, { instant: true });
    controller.focus(0, 120, 0);
    advance(controller, 0, 0.2);
    controller.beginDrag(0.2);
    expect(controller.isTransitioning).toBe(false);
    const before = controller.zoom;
    advance(controller, 0.2, 1.5);
    expect(controller.zoom).toBeGreaterThan(before);
  });

  it('turns drags down as the camera moves in', () => {
    const controller = createController({ closeUp: true });
    expect(controller.dragScale).toBe(1);
    controller.focus(0, 0, 0, { instant: true });
    expect(controller.dragScale).toBeCloseTo(0.35);
  });

  it('puts the focused place the same angle above the screen centre, whatever its latitude', () => {
    for (const [lat, lng] of [
      [38.7223, -9.1393],
      [-37.8136, 144.9631],
      [64.1466, -21.9426],
      [1.29, 103.85],
    ]) {
      const controller = createController({ closeUp: true });
      controller.focus(lat, lng, 0, { instant: true });
      const { x, y, z } = latLngToVector(lat, lng);
      const place = new Vector3(x, y, z).applyEuler(new Euler(controller.pitch - controller.tilt, controller.yaw, 0, 'XYZ'));
      expect(Math.asin(place.y)).toBeCloseTo(ZOOM_PITCH_BIAS, 6);
      expect(place.x).toBeCloseTo(0, 6);
      expect(place.z).toBeGreaterThan(0);
    }
  });

  it('tips the globe back gradually as the zoom grows', () => {
    const controller = createController({ closeUp: true });
    controller.focus(20, 0, 0);
    const tilts: number[] = [];
    for (let now = FRAME; now < 8; now += FRAME) {
      controller.update(FRAME, now);
      tilts.push(controller.tilt);
    }
    expect(tilts[0]).toBeLessThan(tilts[tilts.length - 1]);
    expect(controller.tilt).toBeGreaterThan(0);
  });
});
