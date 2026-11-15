import type { Page } from '@playwright/test';

/** Docs page whose demo gallery turns `closeOnEmptyClick` on. */
export const CLOSE_ON_EMPTY_CLICK_DEMO = '/docs/lightbox/gestures';

type Point = { x: number; y: number };

/**
 * A point in empty viewer space on the active slide: letterbox inside the
 * active Zoom box beside the media when there is room, otherwise the slide's
 * own padding above it. Verified with `elementFromPoint` so a chrome button
 * or the image itself can never be what the test clicks.
 *
 * `insideZoom` insists on the Zoom letterbox (where double-tap zoom applies)
 * and fails rather than falling back to slide padding. `hitTest: false` skips
 * the `elementFromPoint` check, for use while a morph is in flight (the
 * document element takes every hit until it settles).
 */
export async function emptyPoint(page: Page, { insideZoom = false, hitTest = true } = {}): Promise<Point> {
  return page.evaluate(
    ([insideZoom, hitTest]) => {
      const item = document.querySelector('[data-ramka-item][data-active]');
      const zoom = item?.querySelector('[data-ramka-zoom]');
      const media = item?.querySelector('[data-ramka-media]');
      const slide = item?.closest('[data-ramka-slide]');
      if (!item || !zoom || !media || !slide) throw new Error('no active slide with Zoom + Media');
      const z = zoom.getBoundingClientRect();
      const m = media.getBoundingClientRect();
      const s = slide.getBoundingClientRect();
      const MARGIN = 12;

      const candidates: Array<{ x: number; y: number }> = [];
      // Beside the media (left / right letterbox), then above / below it.
      if (m.left - z.left > MARGIN * 2) candidates.push({ x: (z.left + m.left) / 2, y: m.top + m.height / 2 });
      if (z.right - m.right > MARGIN * 2) candidates.push({ x: (m.right + z.right) / 2, y: m.top + m.height / 2 });
      if (m.top - z.top > MARGIN * 2) candidates.push({ x: m.left + m.width / 2, y: (z.top + m.top) / 2 });
      if (z.bottom - m.bottom > MARGIN * 2) candidates.push({ x: m.left + m.width / 2, y: (m.bottom + z.bottom) / 2 });
      if (!insideZoom && z.top - s.top > MARGIN * 2) {
        candidates.push({ x: s.left + s.width / 2, y: (s.top + z.top) / 2 });
      }

      if (!hitTest && candidates[0]) return candidates[0];
      for (const point of candidates) {
        const hit = document.elementFromPoint(point.x, point.y);
        if (!hit || !item.closest('[data-ramka-slide]')!.contains(hit)) continue;
        if (hit.closest('[data-ramka-media], button, a, img')) continue;
        if (insideZoom && !zoom.contains(hit)) continue;
        return point;
      }
      throw new Error(`no empty point found (zoom ${JSON.stringify(z)}, media ${JSON.stringify(m)})`);
    },
    [insideZoom, hitTest] as const,
  );
}

/** Centre of the active slide's media. */
export async function mediaCentre(page: Page): Promise<Point> {
  return page.evaluate(() => {
    const media = document.querySelector('[data-ramka-item][data-active] [data-ramka-media]');
    if (!media) throw new Error('no active media');
    const r = media.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
}
