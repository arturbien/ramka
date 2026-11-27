import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { acquireVtInputGuard, resetVtInputGuardForTesting } from './vt-input-guard';

// jsdom has no TouchEvent constructor — build plain events carrying the one
// TouchList-ish field the guard reads (`touches.length`).
function touchEvent(type: string, options: { cancelable?: boolean; touches?: number } = {}) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: options.cancelable ?? true,
  });
  Object.defineProperty(event, 'touches', {
    value: { length: options.touches ?? 0 },
  });
  return event;
}

function dispatchTouchMove(cancelable = true): boolean {
  const event = touchEvent('touchmove', { cancelable, touches: 1 });
  document.dispatchEvent(event);
  return event.defaultPrevented;
}

// During a morph every wheel event targets <html>, and a swipe begun then keeps
// that target to its end. A swipe begun after it targets the content under the
// pointer.
function dispatchWheel(target: EventTarget = document.documentElement): boolean {
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: -20 });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('acquireVtInputGuard', () => {
  it('does nothing before acquisition', () => {
    expect(dispatchTouchMove()).toBe(false);
  });

  it('prevents cancelable touchmove while held, stops after release', () => {
    const release = acquireVtInputGuard();
    expect(dispatchTouchMove()).toBe(true);
    release();
    expect(dispatchTouchMove()).toBe(false);
  });

  it('leaves non-cancelable touchmove alone (already-committed scroll)', () => {
    const release = acquireVtInputGuard();
    expect(dispatchTouchMove(false)).toBe(false);
    release();
  });

  it('is ref-counted across overlapping morphs', () => {
    const releaseA = acquireVtInputGuard();
    const releaseB = acquireVtInputGuard();
    releaseA();
    expect(dispatchTouchMove()).toBe(true);
    releaseB();
    expect(dispatchTouchMove()).toBe(false);
  });

  it('release is idempotent', () => {
    const releaseA = acquireVtInputGuard();
    const releaseB = acquireVtInputGuard();
    releaseA();
    releaseA();
    // A double release must not steal B's hold.
    expect(dispatchTouchMove()).toBe(true);
    releaseB();
    expect(dispatchTouchMove()).toBe(false);
  });

  it('defers teardown while a finger is still down, detaches on final touchend', () => {
    const release = acquireVtInputGuard();
    document.dispatchEvent(touchEvent('touchstart', { touches: 1 }));
    release();
    // Gesture still in flight — its moves must stay swallowed.
    expect(dispatchTouchMove()).toBe(true);
    // One finger lifts but another remains — keep guarding.
    document.dispatchEvent(touchEvent('touchend', { touches: 1 }));
    expect(dispatchTouchMove()).toBe(true);
    // Last finger lifts — guard detaches.
    document.dispatchEvent(touchEvent('touchend', { touches: 0 }));
    expect(dispatchTouchMove()).toBe(false);
  });

  it('touchcancel also completes a deferred teardown', () => {
    const release = acquireVtInputGuard();
    document.dispatchEvent(touchEvent('touchstart', { touches: 1 }));
    release();
    document.dispatchEvent(touchEvent('touchcancel', { touches: 0 }));
    expect(dispatchTouchMove()).toBe(false);
  });

  it('a touch ending while still held does not tear the guard down', () => {
    const release = acquireVtInputGuard();
    document.dispatchEvent(touchEvent('touchstart', { touches: 1 }));
    document.dispatchEvent(touchEvent('touchend', { touches: 0 }));
    expect(dispatchTouchMove()).toBe(true);
    release();
    expect(dispatchTouchMove()).toBe(false);
  });

  it('a release from before a test reset cannot leave the guard attached', () => {
    const stale = acquireVtInputGuard();
    resetVtInputGuardForTesting();
    const release = acquireVtInputGuard();
    stale();
    release();
    expect(dispatchTouchMove()).toBe(false);
  });
});

describe('acquireVtInputGuard — wheel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    resetVtInputGuardForTesting();
    vi.useRealTimers();
  });

  it('prevents wheel while held, stops after release', () => {
    expect(dispatchWheel()).toBe(false);
    const release = acquireVtInputGuard();
    expect(dispatchWheel()).toBe(true);
    release();
    vi.advanceTimersByTime(1100);
    expect(dispatchWheel()).toBe(false);
  });

  it('keeps swallowing a wheel stream that outlives the morph, detaches once it goes quiet', () => {
    const release = acquireVtInputGuard();
    expect(dispatchWheel()).toBe(true);
    release();
    // The same swipe keeps flowing after the morph ends — still swallowed, so
    // it can neither swipe back nor start scrolling the slides.
    for (let i = 0; i < 10; i++) {
      vi.advanceTimersByTime(16);
      expect(dispatchWheel()).toBe(true);
    }
    // Fingers resting mid-swipe pause the stream without ending the gesture.
    vi.advanceTimersByTime(500);
    expect(dispatchWheel()).toBe(true);
    vi.advanceTimersByTime(1100);
    expect(dispatchWheel()).toBe(false);
  });

  it('lets a new swipe through at once when it follows the swallowed tail without a gap', () => {
    const release = acquireVtInputGuard();
    dispatchWheel();
    release();
    vi.advanceTimersByTime(16);
    expect(dispatchWheel()).toBe(true);
    // The next swipe hit-tests the live DOM before any quiet gap.
    vi.advanceTimersByTime(16);
    expect(dispatchWheel(document.body)).toBe(false);
    expect(dispatchWheel(document.body)).toBe(false);
    // The history-swipe veto outlasts the pass-through until the stream ends.
    expect(document.documentElement.style.overscrollBehaviorX).toBe('none');
    vi.advanceTimersByTime(1100);
    expect(document.documentElement.style.overscrollBehaviorX).toBe('');
  });

  it('keeps swallowing wheel aimed at live content while held', () => {
    const release = acquireVtInputGuard();
    expect(dispatchWheel(document.body)).toBe(true);
    release();
  });

  it('a morph starting during pass-through swallows wheel again', () => {
    const releaseOpen = acquireVtInputGuard();
    dispatchWheel();
    releaseOpen();
    expect(dispatchWheel(document.body)).toBe(false);
    const releaseClose = acquireVtInputGuard();
    expect(dispatchWheel()).toBe(true);
    releaseClose();
  });

  it('stops swallowed wheel events from reaching the lightbox handlers', () => {
    const onContentWheel = vi.fn();
    document.body.addEventListener('wheel', onContentWheel);
    try {
      const release = acquireVtInputGuard();
      document.body.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 20 }));
      expect(onContentWheel).not.toHaveBeenCalled();
      release();
    } finally {
      document.body.removeEventListener('wheel', onContentWheel);
    }
  });

  it('sets overscroll-behavior-x: none on the root while attached, restoring the page value', () => {
    document.documentElement.style.overscrollBehaviorX = 'auto';
    try {
      const releaseA = acquireVtInputGuard();
      const releaseB = acquireVtInputGuard();
      expect(document.documentElement.style.overscrollBehaviorX).toBe('none');
      releaseA();
      expect(document.documentElement.style.overscrollBehaviorX).toBe('none');
      releaseB();
      expect(document.documentElement.style.overscrollBehaviorX).toBe('auto');
    } finally {
      document.documentElement.style.overscrollBehaviorX = '';
    }
  });

  it('a quiet wheel stream while still held does not tear the guard down', () => {
    const release = acquireVtInputGuard();
    dispatchWheel();
    vi.advanceTimersByTime(1100);
    expect(dispatchWheel()).toBe(true);
    expect(dispatchTouchMove()).toBe(true);
    release();
    vi.advanceTimersByTime(1100);
    expect(dispatchWheel()).toBe(false);
  });
});
