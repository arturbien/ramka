import { DEV } from 'esm-env';
import { DIRECTION_LOCK_DISTANCE } from './gestures.js';

function canScrollVertically(el: HTMLElement, deltaY: number) {
  if (el.scrollHeight <= el.clientHeight) return false;
  const { overflowY } = getComputedStyle(el);
  if (overflowY !== 'auto' && overflowY !== 'scroll') return false;
  return deltaY > 0 ? el.scrollTop > 0 : el.scrollTop < el.scrollHeight - el.clientHeight - 1;
}

/** Attachment: a vertical touch drag that no inner scroller can take never chains to the page. */
export function containTouchScroll(host: HTMLElement) {
  let start: { x: number; y: number } | null = null;
  let decision: 'pending' | 'prevent' | 'allow' = 'pending';

  function ontouchstart(e: TouchEvent) {
    start = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    decision = 'pending';
  }

  function ontouchmove(e: TouchEvent) {
    if (!start) return;
    if (e.touches.length !== 1) return void (decision = 'allow');
    if (decision === 'pending') {
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DIRECTION_LOCK_DISTANCE) return;
      let node = e.target instanceof Element ? e.target : null;
      let scrollable = false;
      while (node && node !== host && !scrollable) {
        scrollable = node instanceof HTMLElement && canScrollVertically(node, dy);
        node = node.parentElement;
      }
      decision = Math.abs(dx) > Math.abs(dy) || scrollable ? 'allow' : 'prevent';
    }
    if (decision === 'prevent' && e.cancelable) e.preventDefault();
  }

  function ontouchend(e: TouchEvent) {
    if (e.touches.length === 0) start = null;
  }

  host.addEventListener('touchstart', ontouchstart, { passive: true });
  host.addEventListener('touchmove', ontouchmove, { passive: false });
  host.addEventListener('touchend', ontouchend, { passive: true });
  host.addEventListener('touchcancel', ontouchend, { passive: true });
  return () => {
    host.removeEventListener('touchstart', ontouchstart);
    host.removeEventListener('touchmove', ontouchmove);
    host.removeEventListener('touchend', ontouchend);
    host.removeEventListener('touchcancel', ontouchend);
  };
}

/** Blocks the browser's own pinch and ctrl+wheel page zoom while the lightbox is open. */
export function guardNativePinch() {
  let pinching = false;
  const prevent = (e: Event) => e.preventDefault();
  const ontouchmove = (e: TouchEvent) => {
    if (e.touches.length > 1 || pinching) e.preventDefault();
  };
  const ontouchstart = (e: TouchEvent) => {
    if (e.touches.length > 1) pinching = true;
  };
  const ontouchend = (e: TouchEvent) => {
    if (e.touches.length === 0) pinching = false;
  };
  const onwheel = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault();
  };
  const safari = 'GestureEvent' in window;
  document.addEventListener('touchmove', ontouchmove, { passive: false });
  document.addEventListener('touchstart', ontouchstart, { passive: true });
  document.addEventListener('touchend', ontouchend, { passive: true });
  document.addEventListener('touchcancel', ontouchend, { passive: true });
  if (safari) {
    document.addEventListener('gesturestart', prevent);
    document.addEventListener('gesturechange', prevent);
  } else document.addEventListener('wheel', onwheel, { passive: false });
  return () => {
    document.removeEventListener('touchmove', ontouchmove);
    document.removeEventListener('touchstart', ontouchstart);
    document.removeEventListener('touchend', ontouchend);
    document.removeEventListener('touchcancel', ontouchend);
    document.removeEventListener('gesturestart', prevent);
    document.removeEventListener('gesturechange', prevent);
    document.removeEventListener('wheel', onwheel);
  };
}

const DEFAULT_HINT = 'Give it visible text, or pass `aria-label` / `aria-labelledby`.';

/** Dev-only attachment that warns when a part renders without an accessible name. */
export function warnUnnamed(part: string, { namedByContent = true, hint = DEFAULT_HINT } = {}) {
  return (el: HTMLElement) => {
    if (!DEV) return;
    const timer = setTimeout(() => {
      if (el.getAttribute('aria-hidden') === 'true' || !el.isConnected) return;
      const named = ['aria-label', 'aria-labelledby', 'title'].some((a) => el.getAttribute(a)?.trim());
      if (named || (namedByContent && el.textContent?.trim())) return;
      console.warn(
        `[ramka] ${part} has no accessible name. ${hint} The library ships no default label so it never hard-codes English into your UI.`,
      );
    });
    return () => clearTimeout(timer);
  };
}
