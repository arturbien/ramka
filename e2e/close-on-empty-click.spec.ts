import type { Page } from '@playwright/test';

import { expect, test } from './support/test';
import { PHOTOS_APP, activeZoom, dragBy, openLightbox, zoomSettled } from './support/lightbox';
import { CLOSE_ON_EMPTY_CLICK_DEMO, emptyPoint, mediaCentre } from './support/empty-click';

/**
 * `Lightbox.Content closeOnEmptyClick`. Real layout is the point: in the docs
 * skin Slides covers Content, so the scrim click can never fire and every
 * click beside the image lands on the slide / Zoom letterbox — the hit testing
 * jsdom cannot do.
 */

async function expectStaysOpen(page: Page) {
  // Long enough for a close to have started (it commits synchronously on click).
  await page.waitForTimeout(400);
  await expect(page.locator('[data-ramka-content]')).toHaveAttribute('data-open', '');
}

async function expectCloses(page: Page) {
  await page.locator('[data-ramka-content]').waitFor({ state: 'detached' });
}

test.describe('closeOnEmptyClick', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLOSE_ON_EMPTY_CLICK_DEMO);
    await openLightbox(page);
  });

  test('closes on a click in the letterbox beside the image', async ({ page }) => {
    const point = await emptyPoint(page);
    await page.mouse.click(point.x, point.y);
    await expectCloses(page);
  });

  test('does not close on a click on the image', async ({ page }) => {
    const point = await mediaCentre(page);
    await page.mouse.click(point.x, point.y);
    await expectStaysOpen(page);
  });

  test('does not close on a toolbar button', async ({ page }) => {
    await page.locator('[data-ramka-zoom-in]').click();
    await expect(page.locator('[data-ramka-content]')).toHaveAttribute('data-zoomed', '');
    await expectStaysOpen(page);
  });

  test('does not close on a disabled (pointer-events: none) toolbar button', async ({ page }) => {
    // Zoom out is disabled at 1× and the skin gives disabled buttons
    // `pointer-events: none`, so the click goes to whatever is behind it.
    const zoomOut = page.locator('[data-ramka-zoom-out]');
    await expect(zoomOut).toBeDisabled();
    const box = (await zoomOut.boundingBox())!;
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

    await page.mouse.click(centre.x, centre.y);
    await expectStaysOpen(page);

    // Even with the toolbar row unmarked, so the click lands on plain empty
    // space behind the button, the painted button still keeps it.
    await page.evaluate(() => {
      document
        .querySelector('[data-ramka-zoom-out]')!
        .closest('[data-ramka-no-pull]')!
        .removeAttribute('data-ramka-no-pull');
    });
    await page.mouse.click(centre.x, centre.y);
    await expectStaysOpen(page);
  });

  test('does not close after a drag that starts and ends on empty space', async ({ page }) => {
    const point = await emptyPoint(page);
    // Same element under down and up, so the browser still fires `click`.
    await dragBy(page, point, { x: 0, y: 40 });
    await expectStaysOpen(page);
  });

  test('does not close while zoomed', async ({ page }) => {
    const point = await emptyPoint(page);
    await page.locator('[data-ramka-zoom-in]').click();
    await zoomSettled(page);
    await page.mouse.click(point.x, point.y);
    await expectStaysOpen(page);
    await expect(page.locator('[data-ramka-content]')).toHaveAttribute('data-zoomed', '');
  });

  test('double-click in the letterbox closes on the first click', async ({ page }) => {
    const point = await emptyPoint(page);
    await page.mouse.dblclick(point.x, point.y);
    await expectCloses(page);
  });
});

test.describe('closeOnEmptyClick: double-click on a trigger', () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    // With `reduce` there is no morph, so the second click really does land on
    // the freshly opened viewer. It is placed on empty space (the trigger's
    // spot may be under the image) and sent as the second click of the pair
    // (`detail` 2), the way a user's double-click on the trigger arrives.
    test(`the second click does not close the viewer it opened (${reducedMotion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion });
      await page.goto(CLOSE_ON_EMPTY_CLICK_DEMO);
      await page.locator('[data-ramka-trigger]').first().click();
      await page.locator('[data-ramka-item][data-active] [data-ramka-media]').waitFor();
      const point = await emptyPoint(page, { hitTest: false });
      await page.mouse.move(point.x, point.y);
      await page.mouse.down({ clickCount: 2 });
      await page.mouse.up({ clickCount: 2 });
      await expectStaysOpen(page);
    });
  }
});

test.describe('closeOnEmptyClick off (default)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PHOTOS_APP);
    await openLightbox(page);
  });

  test('a letterbox click does nothing', async ({ page }) => {
    const point = await emptyPoint(page, { insideZoom: true });
    await page.mouse.click(point.x, point.y);
    await expectStaysOpen(page);
  });

  test('a letterbox double-click zooms', async ({ page }) => {
    const point = await emptyPoint(page, { insideZoom: true });
    await page.mouse.dblclick(point.x, point.y);
    await expect(activeZoom(page)).toHaveAttribute('data-zoom', '');
    await expect(page.locator('[data-ramka-content]')).toHaveAttribute('data-open', '');
  });
});
