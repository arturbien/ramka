import {
  DIRECTION_LOCK_DISTANCE,
  DISMISS_DISTANCE,
  SNAP_DURATION,
  pullTransform,
  shouldDismiss,
  springEasing,
} from './gestures.js';
import type { LightboxModel } from './state.svelte.js';

const IGNORED = 'button, a, input, select, textarea, [data-ramka-no-pull]';

/** Attachment: touch drag and trackpad wheel pull the active item down to dismiss. */
export function pullToDismiss(lb: LightboxModel) {
  return (content: HTMLElement) => {
    let item: HTMLElement | undefined;
    let start = { x: 0, y: 0 };
    let axis: 'none' | 'vertical' | 'horizontal' = 'none';
    let samples: { y: number; t: number }[] = [];
    let wheelY = 0;
    let wheelEvents = 0;
    let wheelTimer = 0;

    const host = () => lb.portal ?? content;
    const blocked = () => !lb.open || lb.zoomed || lb.zooming || lb.scrolling || lb.pullDismissing;
    const outside = (target: EventTarget | null) =>
      !(target instanceof Element) || !!target.closest(IGNORED) || (!!lb.stageEl && !lb.stageEl.contains(target));
    let snapTimer = 0;

    function apply(dx: number, dy: number) {
      const t = pullTransform(dx, dy);
      item!.style.transform = `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`;
      host().style.setProperty('--lightbox-pull-progress', String(t.progress));
    }

    function begin() {
      item = lb.stageMorph ?? lb.items.get(lb.index)?.el;
      if (!item) return false;
      clearTimeout(snapTimer);
      item.style.transition = 'none';
      lb.pullSnapping = false;
      lb.pulling = true;
      return true;
    }

    function release(dy: number, velocity: number) {
      lb.pulling = false;
      if (shouldDismiss(dy, velocity)) {
        lb.pullDismissing = true;
        lb.close();
        return;
      }
      const easing = springEasing(Math.min(Math.abs(velocity) / 1000, 2.5));
      const el = item!;
      host().style.setProperty('--lightbox-pull-snap-duration', `${SNAP_DURATION}ms`);
      host().style.setProperty('--lightbox-pull-snap-easing', easing);
      host().style.setProperty('--lightbox-pull-progress', '0');
      el.style.transition = `transform ${SNAP_DURATION}ms ${easing}`;
      el.style.transform = '';
      lb.pullSnapping = true;
      snapTimer = window.setTimeout(() => {
        lb.pullSnapping = false;
        el.style.transition = '';
        host().style.removeProperty('--lightbox-pull-snap-duration');
        host().style.removeProperty('--lightbox-pull-snap-easing');
      }, SNAP_DURATION);
    }

    function onpointerdown(e: PointerEvent) {
      if (e.pointerType === 'mouse' || !e.isPrimary || blocked()) return;
      if (outside(e.target)) return;
      start = { x: e.clientX, y: e.clientY };
      axis = 'none';
      samples = [{ y: e.clientY, t: e.timeStamp }];
    }

    function onpointermove(e: PointerEvent) {
      if (!samples.length || axis === 'horizontal') return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (axis === 'none') {
        if (Math.hypot(dx, dy) < DIRECTION_LOCK_DISTANCE) return;
        axis = Math.abs(dy) >= Math.abs(dx) && !blocked() && begin() ? 'vertical' : 'horizontal';
        if (axis === 'horizontal') return;
        content.setPointerCapture(e.pointerId);
      }
      samples = [...samples.slice(-4), { y: e.clientY, t: e.timeStamp }];
      apply(dx, dy);
    }

    function onpointerup(e: PointerEvent) {
      if (axis === 'vertical') {
        const [a, b] = [samples[0], samples[samples.length - 1]];
        const velocity = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0;
        release(e.type === 'pointercancel' ? 0 : e.clientY - start.y, e.type === 'pointercancel' ? 0 : velocity);
      }
      samples = [];
      axis = 'none';
    }

    function onwheel(e: WheelEvent) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!lb.pulling && (blocked() || outside(e.target))) return;
      e.preventDefault();
      if (!lb.pulling && !begin()) return;
      wheelY -= e.deltaY;
      wheelEvents++;
      apply(0, wheelY);
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        const dismiss = wheelEvents >= 3 && Math.abs(wheelY) >= DISMISS_DISTANCE;
        release(dismiss ? wheelY : 0, 0);
        wheelY = 0;
        wheelEvents = 0;
      }, 90);
    }

    content.addEventListener('pointerdown', onpointerdown);
    content.addEventListener('pointermove', onpointermove);
    content.addEventListener('pointerup', onpointerup);
    content.addEventListener('pointercancel', onpointerup);
    content.addEventListener('wheel', onwheel, { passive: false });
    return () => {
      clearTimeout(wheelTimer);
      clearTimeout(snapTimer);
      content.removeEventListener('pointerdown', onpointerdown);
      content.removeEventListener('pointermove', onpointermove);
      content.removeEventListener('pointerup', onpointerup);
      content.removeEventListener('pointercancel', onpointerup);
      content.removeEventListener('wheel', onwheel);
    };
  };
}
