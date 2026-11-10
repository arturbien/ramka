import { openLightbox } from './support/lightbox';
import { expect, test } from './support/test';

const SVELTE_PHOTOS_APP = '/docs/framework/svelte/examples/lightbox/photos-app';
const SVELTE_URL_SYNCED = '/docs/framework/svelte/examples/lightbox/url-synced-state';

test.describe('svelte docs', () => {
  test('mounts the photos app and opens, navigates and closes on Back', async ({ page }) => {
    await page.goto(SVELTE_PHOTOS_APP);
    const demo = page.locator('[data-svelte-demo]');
    await expect(demo.locator('[data-ramka-trigger]').first()).toBeVisible();
    await page.evaluate(() => ((window as { marker?: string }).marker = 'same document'));

    await openLightbox(page);
    const slides = page.locator('[data-ramka-slides]');
    await expect(slides).toHaveAttribute('data-active-index', '0');

    await page.keyboard.press('ArrowRight');
    await expect(slides).toHaveAttribute('data-active-index', '1');

    await page.goBack();
    await expect(page.locator('[data-ramka-content]')).toHaveCount(0);
    await expect(page).toHaveURL(SVELTE_PHOTOS_APP);
    expect(await page.evaluate(() => (window as { marker?: string }).marker)).toBe('same document');
  });

  test('syncs the URL with the open photo and opens deep links', async ({ page }) => {
    await page.goto(SVELTE_URL_SYNCED);
    await openLightbox(page);
    await expect(page).toHaveURL(`${SVELTE_URL_SYNCED}/1`);

    await page.goBack();
    await expect(page.locator('[data-ramka-content]')).toHaveCount(0);
    await expect(page).toHaveURL(SVELTE_URL_SYNCED);

    await page.goto(`${SVELTE_URL_SYNCED}/5`);
    await expect(page.locator('[data-ramka-slides]')).toHaveAttribute('data-active-index', '4');
  });

  test('switches frameworks on the same page and keeps the hash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/docs/lightbox/rtl#mirrors');
    await page.locator('aside [data-framework="svelte"]').click();
    await expect(page).toHaveURL('/docs/framework/svelte/lightbox/rtl#mirrors');
    await expect(page.locator('h1')).toHaveText('RTL support');

    await page.locator('aside [data-framework="react"]').click();
    await expect(page).toHaveURL('/docs/lightbox/rtl#mirrors');
  });
});
