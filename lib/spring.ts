/**
 * A small spring system in Apple's designer-facing parameterisation.
 *
 * Springs replace fixed-duration curves because they are inherently
 * interruptible: retargeting mid-flight keeps the current value *and* velocity,
 * so a gesture can be reversed without the visible "brick wall" you get when
 * one CSS transition is swapped for another.
 */

export interface SpringConfig {
  /** Seconds to reach the target. Lower is snappier. Not a duration. */
  response: number;
  /** 1 = critically damped (no overshoot). Below 1 bounces. */
  damping: number;
  /** Settle threshold, in the spring's own units. */
  epsilon?: number;
}

/** Values Apple ships (Designing Fluid Interfaces, WWDC18). */
export const SPRING = {
  /** Repositioning something on screen — graceful, never distracting. */
  move: { response: 0.4, damping: 1 },
  /** Only after a gesture carried momentum: a flick, a throw, a drag release. */
  momentum: { response: 0.4, damping: 0.8 },
  /** Drawers and sheets. */
  sheet: { response: 0.3, damping: 0.8 },
  /** Unitless reveals (opacity, scale) need a finer settle threshold. */
  material: { response: 0.35, damping: 1, epsilon: 0.0015 },
} satisfies Record<string, SpringConfig>;

/** Ignore huge gaps — a backgrounded tab must not launch the spring. */
const MAX_FRAME = 1 / 15;
/** Fixed sub-steps keep stiff springs stable regardless of frame rate. */
const SUB_STEP = 1 / 480;

export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private config: SpringConfig;

  constructor(value: number, config: SpringConfig) {
    this.value = value;
    this.target = value;
    this.config = config;
  }

  configure(config: SpringConfig) {
    this.config = config;
  }

  setTarget(target: number) {
    this.target = target;
  }

  /** Jump there with no motion: first placement, or reduced motion. */
  snap(value: number) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  /** Advance by `dt` seconds. Returns true while still in motion. */
  step(dt: number): boolean {
    const { response, damping, epsilon = 0.05 } = this.config;
    const omega = (2 * Math.PI) / response;
    let remaining = Math.min(dt, MAX_FRAME);

    while (remaining > 0) {
      const h = Math.min(SUB_STEP, remaining);
      const accel =
        -omega * omega * (this.value - this.target) -
        2 * damping * omega * this.velocity;
      this.velocity += accel * h;
      this.value += this.velocity * h;
      remaining -= h;
    }

    if (
      Math.abs(this.target - this.value) < epsilon &&
      Math.abs(this.velocity) < epsilon
    ) {
      this.value = this.target;
      this.velocity = 0;
      return false;
    }
    return true;
  }
}

/**
 * Where a flick would come to rest, using the same exponential decay as scroll
 * deceleration. Snap to the target nearest *this* point rather than the release
 * point, so a small flick produces a large, intentional-feeling result.
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as frozen; easing
 * off reads as "still responding, but there's nothing more here".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Rolling pointer history. Velocity at release has to come from the last few
 * moves, not the final pair — one stale sample flattens a fast flick.
 */
export class VelocityTracker {
  private samples: { value: number; time: number }[] = [];

  add(value: number, time: number) {
    this.samples.push({ value, time });
    if (this.samples.length > 6) this.samples.shift();
  }

  reset() {
    this.samples = [];
  }

  /** Units per second. */
  get(): number {
    if (this.samples.length < 2) return 0;
    const last = this.samples[this.samples.length - 1];
    let first = this.samples[0];
    for (const sample of this.samples) {
      if (last.time - sample.time <= 100) {
        first = sample;
        break;
      }
    }
    const dt = (last.time - first.time) / 1000;
    if (dt <= 0) return 0;
    return (last.value - first.value) / dt;
  }
}
