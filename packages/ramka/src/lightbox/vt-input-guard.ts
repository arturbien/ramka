// ---------------------------------------------------------------------------
// Document-level touch-pan and wheel guard, held while a lightbox View
// Transition runs.
//
// Why it exists: while a document view transition is running, the
// ::view-transition pseudo tree covers the viewport, and because the morph
// keeps :root captured (the page-behind cross-fade is the root group), hit
// testing for the whole captured page resolves to the <html> element itself
// (see w3c/csswg-drafts#8278). Content's pull-to-dismiss handlers and its
// `overscroll-behavior: contain` boundary never see the input, so the browser
// treats it as a gesture on the root scroller:
//
// - Touch: on iOS Safari, when the page has been scrolled down (address bar
//   collapsed), panning upward DURING the open/close morph expands the address
//   bar — resizing the viewport mid-transition, which glitches or skips the
//   morph. Browser-chrome expansion is NOT stopped by the `overflow: hidden`
//   scroll lock, and a Silk-style inner "scroll trap" element can't catch a
//   gesture that never hit-tests into the DOM.
// - Wheel: a sideways trackpad swipe overscrolls the root — the browser's
//   back/forward swipe. Chrome and Firefox honor `overscroll-behavior-x: none`
//   on the root; Safari only skips it for wheel events the page canceled, and
//   re-targets a swipe begun mid-morph to the slides once the transition ends.
//
// The one reliable veto is to cancel the input stream itself: when the first
// touchmove of a gesture is preventDefault-ed, the browser never starts a
// scroll and never moves its chrome (the same technique Content already uses
// to block native pinch-zoom while mounted); a canceled wheel event is one the
// page handled. The guard is capture-phase and non-passive, and held only for
// the morph's duration — including the open morph's pre-transition
// prepare/decode wait, when the viewer is still `visibility: hidden`
// (non-hit-testable) and the page is not yet locked.
//
// Ref-counted because morphs from different Roots can overlap (opening
// lightbox B while A's close morph is in flight). If a finger is still down,
// or a wheel stream is still flowing, when the last hold is released, teardown
// is deferred until the gesture ends (the final touchend/touchcancel, or a
// quiet gap in wheel events): releasing mid-gesture would let the rest of it
// act the instant the transition ends. Nothing is lost by holding on — that
// gesture began against the stale <html> / VT overlay, so it could never
// become a meaningful gesture for the live DOM anyway.
//
// Once the morph is over, only the wheel tail of a swipe begun during it is
// swallowed. Browsers keep a wheel gesture's target for its whole run, momentum
// included, so that tail still targets <html>. A new swipe hit-tests the live
// DOM and must scroll at once (quick successive swipes leave no quiet gap), so
// wheel passes through from then on. Deltas can't tell the two apart: Safari
// resumes the old swipe with a jump in deltas when the transition ends. Any of
// the old swipe that gets through scrolls the slides without the start of the
// gesture, so WebKit doesn't treat it as a user scroll and re-snaps the slides
// on every slide change. Only the root's `overscroll-behavior-x: none` stays
// until the stream goes quiet.
//
// A close is different: its tail is usually the momentum of the flick that
// pulled the lightbox shut. That gesture was latched to Content, and Content
// keeps it off the page. Safari drops the latch when the lightbox unmounts, so
// the momentum hit-tests the page and would scroll it. So when a wheel stream
// is already flowing as a close begins (its first event comes within a frame),
// that stream is swallowed for as long as it runs without a gap; a new gesture
// starts after one. A wheel the user starts during or after the close isn't
// armed this way, so mouse-wheel scrolling of the page isn't held back.
// Events still aimed at <html> stay swallowed either way, as after an open.
// ---------------------------------------------------------------------------

/**
 * Wheel silence that ends a stream. Fingers resting on the trackpad pause the
 * events without ending the gesture, and if Safari then lets the rest of it
 * reach the slides they jump on every slide change. A new swipe doesn't wait
 * for this (see the module comment), so it can be long.
 */
const WHEEL_QUIET_MS = 1000;
/** Gap that starts a new wheel gesture: lifting and landing fingers takes longer than a frame. */
const WHEEL_STREAM_GAP_MS = 50;

let holdCount = 0;
/** Bumped by the test reset so releases of dropped holds become no-ops. */
let epoch = 0;
let attached = false;
/** A touch that began while the guard was attached is still on screen. */
let touchInFlight = false;
/** Pending while a wheel stream is in flight. */
let wheelQuietTimer: ReturnType<typeof setTimeout> | undefined;
let wheelPassthrough = false;
let lastWheelTime = -Infinity;
/** When the latest close hold began, until the next wheel event checks it. */
let closeStartTime: number | undefined;
/** A wheel stream was already flowing when a close began (see the module comment). */
let closeTail = false;
let originalOverscrollBehaviorX = '';

function detachIfIdle(): void {
  if (holdCount === 0 && !touchInFlight && wheelQuietTimer === undefined) {
    detach();
  }
}

function onTouchStart(): void {
  touchInFlight = true;
}

function onTouchMove(event: TouchEvent): void {
  // Non-cancelable moves belong to a scroll the browser already committed to
  // (a gesture predating the guard) — preventDefault would only warn.
  if (event.cancelable) {
    event.preventDefault();
  }
}

function onTouchSettled(event: TouchEvent): void {
  if (event.touches.length > 0) return;
  touchInFlight = false;
  detachIfIdle();
}

function setWheelPassthrough(passthrough: boolean): void {
  if (wheelPassthrough === passthrough) return;
  wheelPassthrough = passthrough;
  // Passive while passing through, so the browser needn't wait on the main
  // thread before scrolling.
  document.removeEventListener('wheel', onWheel, { capture: true });
  document.addEventListener('wheel', onWheel, { capture: true, passive: passthrough });
}

function onWheel(event: WheelEvent): void {
  clearTimeout(wheelQuietTimer);
  wheelQuietTimer = setTimeout(onWheelQuiet, WHEEL_QUIET_MS);
  const gap = event.timeStamp - lastWheelTime;
  lastWheelTime = event.timeStamp;
  if (closeStartTime !== undefined) {
    if (event.timeStamp - closeStartTime < WHEEL_STREAM_GAP_MS) closeTail = true;
    closeStartTime = undefined;
  }
  if (wheelPassthrough) return;
  if (holdCount === 0 && event.target !== document.documentElement && (!closeTail || gap >= WHEEL_STREAM_GAP_MS)) {
    setWheelPassthrough(true);
    return;
  }
  if (event.cancelable) {
    event.preventDefault();
  }
  // Keep Content's own wheel handlers (pull-to-dismiss, zoom) from acting on
  // a tail Safari re-targeted into the live DOM.
  event.stopPropagation();
}

function onWheelQuiet(): void {
  wheelQuietTimer = undefined;
  detachIfIdle();
}

function attach(): void {
  if (attached) return;
  attached = true;
  touchInFlight = false;
  const html = document.documentElement;
  originalOverscrollBehaviorX = html.style.overscrollBehaviorX;
  html.style.overscrollBehaviorX = 'none';
  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  document.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
  document.addEventListener('touchend', onTouchSettled, { capture: true, passive: true });
  document.addEventListener('touchcancel', onTouchSettled, { capture: true, passive: true });
  document.addEventListener('wheel', onWheel, { capture: true, passive: false });
}

function detach(): void {
  if (!attached) return;
  attached = false;
  wheelPassthrough = false;
  closeStartTime = undefined;
  closeTail = false;
  clearTimeout(wheelQuietTimer);
  wheelQuietTimer = undefined;
  document.documentElement.style.overscrollBehaviorX = originalOverscrollBehaviorX;
  document.removeEventListener('touchstart', onTouchStart, { capture: true });
  document.removeEventListener('touchmove', onTouchMove, { capture: true });
  document.removeEventListener('touchend', onTouchSettled, { capture: true });
  document.removeEventListener('touchcancel', onTouchSettled, { capture: true });
  document.removeEventListener('wheel', onWheel, { capture: true });
}

/**
 * Hold the input guard for the duration of a View Transition morph.
 * Returns an idempotent release function — safe to call from both a morph's
 * early-bail paths and its `finished` finalizer.
 */
function acquireVtInputGuard(morph: 'open' | 'close'): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }
  holdCount += 1;
  attach();
  if (morph === 'close') closeStartTime = performance.now();
  // A new morph (e.g. closing during an open's tail) swallows wheel again.
  setWheelPassthrough(false);
  const holdEpoch = epoch;
  let released = false;
  return () => {
    if (released || holdEpoch !== epoch) return;
    released = true;
    holdCount -= 1;
    // Defer teardown while a gesture is still in flight (see module comment).
    detachIfIdle();
  };
}

/**
 * Test-only: drop all holds and detach. Unit tests mock `startViewTransition`
 * with a `finished` promise they never resolve, which would leak a hold into
 * subsequent tests (in a real browser `finished` always settles, even for
 * skipped transitions).
 */
function resetVtInputGuardForTesting(): void {
  holdCount = 0;
  epoch += 1;
  detach();
}

export { acquireVtInputGuard, resetVtInputGuardForTesting };
