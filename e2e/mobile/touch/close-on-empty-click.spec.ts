import { expect, test } from '../../support/test';
import { activeZoom, centreOf, openLightbox, touchDrag } from '../../support/lightbox';
import { CLOSE_ON_EMPTY_CLICK_DEMO, emptyPoint } from '../../support/empty-click';

/**
 * `closeOnEmptyClick` with real touch. The close is driven by the browser's
 * compatibility `click` after a tap, so what matters here is that a tap
 * produces one, and that a swipe — which the browser turns into a native
 * scroll and cancels the pointer for — does not.
 */
test.describe('closeOnEmptyClick (touch)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLOSE_ON_EMPTY_CLICK_DEMO);
    await openLightbox(page);
  });

  test('a tap on empty space closes', async ({ page }) => {
    const point = await emptyPoint(page);
    await page.touchscreen.tap(point.x, point.y);
    await page.locator('[data-ramka-content]').waitFor({ state: 'detached' });
  });

  test('a swipe that starts on empty space navigates instead of closing', async ({ page }) => {
    const point = await emptyPoint(page);
    const centre = await centreOf(activeZoom(page));
    await touchDrag(page, point, { x: -Math.round(centre.x * 1.6), y: 0 });

    await expect(page.locator('[data-ramka-slides]')).not.toHaveAttribute('data-active-index', '0');
    await page.waitForTimeout(400);
    await expect(page.locator('[data-ramka-content]')).toHaveAttribute('data-open', '');
  });

  test('a short pull that snaps back does not close', async ({ page }) => {
    const point = await emptyPoint(page);
    const content = page.locator('[data-ramka-content]');
    await touchDrag(page, point, { x: 0, y: 60 });
    await expect(async () => {
      expect(await content.getAttribute('data-pull-snapping')).toBeNull();
    }).toPass({ timeout: 5_000 });
    await expect(content).toHaveAttribute('data-open', '');
  });

  test('a tap right after a swipe settles closes', async ({ page }) => {
    const point = await emptyPoint(page);
    const centre = await centreOf(activeZoom(page));
    await touchDrag(page, point, { x: -Math.round(centre.x * 1.6), y: 0 });
    const slides = page.locator('[data-ramka-slides]');
    await expect(slides).not.toHaveAttribute('data-active-index', '0');
    // Settled: scrollLeft holds still across two polls. Until then Slides
    // holds its fling lock, which (correctly) vetoes the close.
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-ramka-slides]') as HTMLElement & { __last?: number };
        const now = el.scrollLeft;
        const still = el.__last === now;
        el.__last = now;
        return still;
      },
      undefined,
      { polling: 200 },
    );
    const next = await emptyPoint(page);
    await page.touchscreen.tap(next.x, next.y);
    await page.locator('[data-ramka-content]').waitFor({ state: 'detached' });
  });
});
