import { describe, expect, it } from 'vitest';
import { nearestIndex, progressAt } from './geometry.js';
import {
  arrowKeyDelta,
  computeMaxZoom,
  elasticClamp,
  invertElasticClamp,
  isPerceptibleSnapback,
  momentumVelocity,
  panRange,
  pullTransform,
  resolveIndex,
  resolvePinchZoom,
  rubberBandClamp,
  scaleZoom,
  shouldDismiss,
  springEasing,
  zoomProgress,
} from './gestures.js';
import { objectPositionOffset } from './placeholder.js';
import { scrollOption } from './state.svelte.js';

describe('pull', () => {
  it('damps the drag and shrinks toward 0.85', () => {
    const t = pullTransform(0, 1000);
    expect(t.y).toBeLessThan(120);
    expect(t.scale).toBeCloseTo(0.85);
    expect(pullTransform(0, 0)).toMatchObject({ x: 0, y: 0, scale: 1, progress: 0 });
  });

  it('dismisses on distance or same direction velocity', () => {
    expect(shouldDismiss(100, 0)).toBe(true);
    expect(shouldDismiss(20, 500)).toBe(true);
    expect(shouldDismiss(20, -500)).toBe(false);
    expect(shouldDismiss(20, 100)).toBe(false);
  });

  it('samples a spring that ends at 1', () => {
    const easing = springEasing();
    expect(easing.startsWith('linear(0,')).toBe(true);
    expect(easing.endsWith(', 1)')).toBe(true);
  });
});

describe('zoom math', () => {
  it('rubber bands past an edge toward the dimension', () => {
    expect(rubberBandClamp(50, 0, 100, 80)).toBe(50);
    expect(rubberBandClamp(110, 0, 100, 80)).toBeCloseTo(100 + (10 * 80 * 0.28) / (80 + 2.8));
    expect(rubberBandClamp(1e6, 0, 100, 80)).toBeLessThan(180);
    expect(rubberBandClamp(-1e6, 0, 100, 80)).toBeGreaterThan(-80);
    expect(rubberBandClamp(150, 0, 100, 0)).toBe(100);
  });

  it('resists pinch overshoot linearly and inverts it', () => {
    expect(elasticClamp(2, 1, 4)).toBe(2);
    expect(elasticClamp(6, 1, 4)).toBeCloseTo(4.4);
    expect(elasticClamp(0.5, 1, 4)).toBeCloseTo(0.9);
    expect(invertElasticClamp(elasticClamp(6, 1, 4), 1, 4)).toBeCloseTo(6);
    expect(invertElasticClamp(0.9, 1, 4)).toBeCloseTo(0.5);
  });

  it('holds zoom inside the pinch dead zone', () => {
    const [a0, b0] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
    ];
    const wobble = resolvePinchZoom(2, 200, false, a0, { x: -4, y: 1 }, b0, { x: 204, y: -1 });
    expect(wobble).toEqual({ zoom: 2, engaged: false, baseline: 200 });
    const spread = resolvePinchZoom(2, 200, false, a0, { x: -20, y: 0 }, b0, { x: 220, y: 0 });
    expect(spread.engaged).toBe(true);
    expect(spread.zoom).toBeCloseTo(2.4);
    expect(resolvePinchZoom(2, 200, true, a0, { x: 0, y: 0 }, b0, { x: 300, y: 0 }).zoom).toBeCloseTo(3);
  });

  it('needs more spread while both fingers slide together and eats the slop', () => {
    const [a0, b0] = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
    ];
    const slide = resolvePinchZoom(1, 200, false, a0, { x: 0, y: 60 }, b0, { x: 220, y: 60 });
    expect(slide.engaged).toBe(false);
    const engaged = resolvePinchZoom(1, 200, false, a0, { x: 0, y: 60 }, b0, { x: 240, y: 60 });
    expect(engaged.engaged).toBe(true);
    expect(engaged.baseline).toBe(228);
    expect(engaged.zoom).toBeCloseTo(240 / 228);
  });

  it('measures release velocity over the window above the flick threshold', () => {
    expect(momentumVelocity([])).toBeNull();
    expect(momentumVelocity([{ x: 0, y: 0, t: 0 }])).toBeNull();
    expect(
      momentumVelocity([
        { x: 0, y: 0, t: 0 },
        { x: 2, y: 0, t: 100 },
      ]),
    ).toBeNull();
    expect(
      momentumVelocity([
        { x: 0, y: 0, t: 0 },
        { x: 50, y: -20, t: 50 },
      ]),
    ).toEqual({ x: 1000, y: -400 });
  });

  it('caps wheel zoom at 2x per event', () => {
    expect(scaleZoom(1, 1000, 100)).toBe(2);
    expect(scaleZoom(2, -1000, 100)).toBe(1);
    expect(scaleZoom(1, 50, 100)).toBeCloseTo(1.5);
  });

  it('computes max zoom from natural size, at least one step above min', () => {
    expect(computeMaxZoom(4000, 3000, 1000, 750, 1, 4)).toBe(4);
    expect(computeMaxZoom(800, 600, 1000, 750, 1, 4)).toBe(2);
    expect(computeMaxZoom(0, 0, 1000, 750, 1, 4)).toBe(4);
  });

  it('maps zoom to progress over one step', () => {
    expect(zoomProgress(1, 1, 4)).toBe(0);
    expect(zoomProgress(1.5, 1, 4)).toBe(0.5);
    expect(zoomProgress(3, 1, 4)).toBe(1);
  });

  it('flags only a perceptible snapback', () => {
    expect(isPerceptibleSnapback(4.2, 1, 4)).toBe(true);
    expect(isPerceptibleSnapback(4.01, 1, 4)).toBe(false);
    expect(isPerceptibleSnapback(0.9, 1, 4)).toBe(true);
  });

  it('keeps a large box covering the viewport and pins a small one', () => {
    expect(panRange(2000, 500, 0, 1000)).toEqual([-500, 500]);
    expect(panRange(400, 500, 0, 1000)).toEqual([0, 0]);
  });
});

describe('navigation', () => {
  it('mirrors horizontal arrows in RTL', () => {
    expect(arrowKeyDelta('ArrowRight', 'ltr')).toBe(1);
    expect(arrowKeyDelta('ArrowRight', 'rtl')).toBe(-1);
    expect(arrowKeyDelta('ArrowLeft', 'rtl')).toBe(1);
    expect(arrowKeyDelta('ArrowDown', 'rtl')).toBe(1);
    expect(arrowKeyDelta('Enter', 'ltr')).toBe(0);
  });

  it('clamps or wraps indices', () => {
    expect(resolveIndex(-1, 5, false)).toBe(0);
    expect(resolveIndex(7, 5, false)).toBe(4);
    expect(resolveIndex(-1, 5, true)).toBe(4);
    expect(resolveIndex(5, 5, true)).toBe(0);
  });

  it('reads fractional progress in LTR and RTL', () => {
    const ltr = [0, 100, 200].map((offset, index) => ({ index, offset }));
    const rtl = [0, -100, -200].map((offset, index) => ({ index, offset }));
    expect(progressAt(ltr, 150)).toBe(1.5);
    expect(progressAt(rtl, -150)).toBe(1.5);
    expect(progressAt(ltr, -20)).toBe(0);
    expect(progressAt(ltr, 999)).toBe(2);
    expect(progressAt([], 10)).toBe(0);
  });

  it('finds the nearest slide', () => {
    const slides = [0, 100, 200].map((offset, index) => ({ index, offset }));
    expect(nearestIndex(slides, 140)).toBe(1);
    expect(nearestIndex(slides, 160)).toBe(2);
    expect(nearestIndex([], 0)).toBe(-1);
  });
});

describe('options', () => {
  it('resolves object-position keywords and percentages', () => {
    expect(objectPositionOffset('', 100, 50)).toEqual({ x: 50, y: 25 });
    expect(objectPositionOffset('left top', 100, 50)).toEqual({ x: 0, y: 0 });
    expect(objectPositionOffset('25% bottom', 100, 50)).toEqual({ x: 25, y: 50 });
  });

  it('picks scrollTriggerIntoView entries by moment with defaults', () => {
    expect(scrollOption(null, 'onClose')).toBeUndefined();
    expect(scrollOption({ type: 'onClose' }, 'onClose')).toEqual({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
    expect(scrollOption([{ type: 'onChange', block: 'center' }], 'onChange')?.block).toBe('center');
    expect(scrollOption([{ type: 'onChange' }], 'onClose')).toBeUndefined();
  });
});
