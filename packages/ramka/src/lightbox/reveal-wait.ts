/**
 * Frames a close waits for `reveal` to mount a trigger and for its
 * position to settle (~130ms at 60Hz) — long enough for a virtualizer to
 * scroll, render and re-measure a row, short enough that a miss reads as a
 * slightly late fade rather than a hang.
 */
const REVEAL_TRIGGER_MAX_FRAMES = 8;
/** Consecutive frames a revealed trigger's rect must hold before the morph reads it. */
const REVEAL_TRIGGER_STABLE_FRAMES = 2;

/**
 * Wait for the close target to mount AND hold its position, then call
 * `onSettled` (or after the frame budget, whether or not it appeared). A
 * virtualizer keeps correcting its scroll for a few frames after the row
 * renders, and the morph reads the trigger's rect once, when it starts.
 * Only morphing closes wait, so this ships in the morph runtime chunk.
 */
export function waitForStableTrigger(
  getTrigger: () => HTMLElement | null,
  signal: AbortSignal,
  onSettled: () => void,
): void {
  let frames = 0;
  let stableFrames = 0;
  let lastRect: DOMRect | null = null;
  const tick = () => {
    if (signal.aborted) return;
    frames += 1;
    const rect = getTrigger()?.getBoundingClientRect();
    if (rect) {
      const same =
        lastRect &&
        rect.top === lastRect.top &&
        rect.left === lastRect.left &&
        rect.width === lastRect.width &&
        rect.height === lastRect.height;
      stableFrames = same ? stableFrames + 1 : 0;
      lastRect = rect;
    }
    if (stableFrames >= REVEAL_TRIGGER_STABLE_FRAMES || frames >= REVEAL_TRIGGER_MAX_FRAMES) {
      onSettled();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
