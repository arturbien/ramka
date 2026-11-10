export const DISMISS_DISTANCE = 100;
const DISMISS_VELOCITY = 400;
export const DIRECTION_LOCK_DISTANCE = 6;
export const SNAP_DURATION = 270;
const MIN_SCALE = 0.85;
const SNAPBACK_HAPTIC_OVERSHOOT = 0.01;
const ELASTIC_FACTOR = 0.2;
const RUBBER_BAND_CONSTANT = 0.28;
export const RUBBER_BAND_TOUCH = 0.16;
export const RUBBER_BAND_MOUSE = 0.09;
export const PAN_FRICTION = 3.2;
const MOMENTUM_THRESHOLD = 50;
const PINCH_ENGAGE_SPREAD = 10;
const PINCH_ENGAGE_SPREAD_PAN = 28;
const PINCH_ENGAGE_SPREAD_PAN_RATIO = 0.14;
const PINCH_PAN_ALIGNMENT = 0.6;
const PINCH_ALIGNMENT_MIN_TRAVEL = 10;
const PINCH_PAN_TRAVEL = 14;
const PINCH_PAN_DOMINANCE = 1.35;

type Point = { x: number; y: number };

export type TextDirection = 'ltr' | 'rtl';

export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Damped pull offset and scale for a raw drag delta (ported from ramka's pull-math). */
export function pullTransform(dx: number, dy: number) {
  const absY = Math.abs(dy);
  const maxY = DISMISS_DISTANCE * 1.2;
  const dampedY = maxY * (1 - Math.exp(-absY / maxY));
  const factor = absY > 0 ? dampedY / absY : 1;
  const maxX = DISMISS_DISTANCE * 0.5;
  const x = Math.sign(dx) * maxX * (1 - Math.exp(-(Math.abs(dx) * factor) / maxX));
  const progress = Math.min(absY / DISMISS_DISTANCE, 1);
  return { x, y: Math.sign(dy) * dampedY, scale: 1 - progress * (1 - MIN_SCALE), progress };
}

/** True when a released pull went far or fast enough in its own direction. */
export function shouldDismiss(dy: number, velocity: number) {
  const same = Math.sign(dy) === Math.sign(velocity) && velocity !== 0;
  return Math.abs(dy) >= DISMISS_DISTANCE || (Math.abs(velocity) >= DISMISS_VELOCITY && same);
}

/** Critically damped spring sampled into a CSS linear() easing. */
export function springEasing(velocity = 0, settle = 7.5, samples = 40) {
  const s = (p: number) => Math.exp(-settle * p) * (1 + (velocity + settle) * p);
  const points = Array.from({ length: samples }, (_, i) =>
    i === samples - 1 ? '1' : String(Math.min(Math.round((1 - s(i / (samples - 1))) * 1e4) / 1e4, 1)),
  );
  return `linear(${points.join(', ')})`;
}

/** UIScrollView rubber band: in range passes through, past an edge the overflow approaches `dimension`. */
export function rubberBandClamp(value: number, min: number, max: number, dimension: number) {
  const band = (x: number) =>
    dimension > 0 ? (x * dimension * RUBBER_BAND_CONSTANT) / (dimension + RUBBER_BAND_CONSTANT * x) : 0;
  return value < min ? min - band(min - value) : value > max ? max + band(value - max) : value;
}

/** Linear resistance past the zoom bounds, used for pinch overshoot. */
export function elasticClamp(value: number, min: number, max: number) {
  return value < min
    ? min - (min - value) * ELASTIC_FACTOR
    : value > max
      ? max + (value - max) * ELASTIC_FACTOR
      : value;
}

/** Inverse of `elasticClamp`, so a new pinch continues from a displayed overshoot without a jump. */
export function invertElasticClamp(displayed: number, min: number, max: number) {
  return displayed < min
    ? min - (min - displayed) / ELASTIC_FACTOR
    : displayed > max
      ? max + (displayed - max) / ELASTIC_FACTOR
      : displayed;
}

/** Pinch zoom with iOS-style begin slop: zoom holds until the fingers spread, a two-finger slide needs more spread. */
export function resolvePinchZoom(
  zoom: number,
  baseline: number,
  engaged: boolean,
  a0: Point,
  a1: Point,
  b0: Point,
  b1: Point,
) {
  const current = Math.hypot(a1.x - b1.x, a1.y - b1.y);
  if (engaged) return { zoom: (zoom * current) / baseline, engaged, baseline };
  const [ax, ay, bx, by] = [a1.x - a0.x, a1.y - a0.y, b1.x - b0.x, b1.y - b0.y];
  const [la, lb] = [Math.hypot(ax, ay), Math.hypot(bx, by)];
  const aligned =
    la >= PINCH_ALIGNMENT_MIN_TRAVEL &&
    lb >= PINCH_ALIGNMENT_MIN_TRAVEL &&
    (ax * bx + ay * by) / (la * lb) >= PINCH_PAN_ALIGNMENT;
  const pan = Math.hypot((ax + bx) / 2, (ay + by) / 2);
  const spread = current - baseline;
  const panIntent = aligned || (pan >= PINCH_PAN_TRAVEL && pan > Math.abs(spread) * PINCH_PAN_DOMINANCE);
  const gate = panIntent
    ? Math.max(PINCH_ENGAGE_SPREAD_PAN, baseline * PINCH_ENGAGE_SPREAD_PAN_RATIO)
    : PINCH_ENGAGE_SPREAD;
  if (Math.abs(spread) <= gate) return { zoom, engaged: false, baseline };
  const next = panIntent ? baseline + Math.sign(spread) * gate : baseline;
  return { zoom: (zoom * current) / next, engaged: true, baseline: next };
}

/** Release velocity in px/s over the sampled window, or null below the flick threshold. */
export function momentumVelocity(samples: readonly (Point & { t: number })[]) {
  const [first, last] = [samples[0], samples[samples.length - 1]];
  const dt = last && last.t - first.t;
  if (!dt || dt <= 0) return null;
  const v = { x: ((last.x - first.x) / dt) * 1000, y: ((last.y - first.y) / dt) * 1000 };
  return Math.hypot(v.x, v.y) > MOMENTUM_THRESHOLD ? v : null;
}

/** Wheel delta to zoom factor, capped at 2x per event (ramka's scaleZoom). */
export function scaleZoom(zoom: number, delta: number, sensitivity: number) {
  return zoom * Math.min(1 + Math.abs(delta / sensitivity), 2) ** Math.sign(delta);
}

/** Auto max zoom: the image at its natural pixel size, but at least one step above `min`. */
export function computeMaxZoom(
  imageW: number,
  imageH: number,
  boxW: number,
  boxH: number,
  min: number,
  fallback: number,
) {
  if (!imageW || !imageH || !boxW || !boxH) return fallback;
  return Math.max(imageW / boxW, imageH / boxH, min + 1);
}

/** 0 at `min`, 1 once zoom rose one step above `min`; drives `--lightbox-zoom-progress`. */
export function zoomProgress(scale: number, min: number, max: number) {
  const range = Math.max(0.01, Math.min(max, min + 1) - min);
  return clamp((scale - min) / range, 0, 1);
}

/** True when a released zoom overshot its bounds enough that the snap back is felt. */
export function isPerceptibleSnapback(zoom: number, min: number, max: number) {
  const bound = clamp(zoom, min, max);
  return Math.abs(zoom - bound) > bound * SNAPBACK_HAPTIC_OVERSHOOT;
}

/** Pan range on one axis that keeps a scaled box covering the viewport, or pinned when it is smaller. */
export function panRange(size: number, center: number, viewStart: number, viewEnd: number) {
  const toStart = viewStart - center + size / 2;
  const toEnd = viewEnd - center - size / 2;
  if (size <= viewEnd - viewStart) {
    const pinned = clamp(0, toStart, toEnd);
    return [pinned, pinned] as const;
  }
  return [toEnd, toStart] as const;
}

/** Slide index step for an arrow key, mirrored horizontally in RTL. */
export function arrowKeyDelta(key: string, dir: TextDirection) {
  const rtl = dir === 'rtl' ? -1 : 1;
  return ({ ArrowRight: rtl, ArrowLeft: -rtl, ArrowDown: 1, ArrowUp: -1 } as Record<string, number>)[key] ?? 0;
}

/** Clamps or wraps an index into `[0, count)`. */
export function resolveIndex(i: number, count: number, loop: boolean) {
  return loop ? ((i % count) + count) % count : clamp(i, 0, count - 1);
}

/** Short vibration on devices that support it. */
export function haptic() {
  try {
    navigator.vibrate?.(10);
  } catch {}
}

/** rAF tween from 0 to 1 with ease-out cubic; returns a cancel function. */
export function tween(duration: number, step: (t: number) => void, done?: () => void) {
  const start = performance.now();
  let frame = requestAnimationFrame(function tick(now) {
    const p = duration > 0 ? Math.min((now - start) / duration, 1) : 1;
    step(1 - Math.pow(1 - p, 3));
    if (p < 1) frame = requestAnimationFrame(tick);
    else done?.();
  });
  return () => cancelAnimationFrame(frame);
}
