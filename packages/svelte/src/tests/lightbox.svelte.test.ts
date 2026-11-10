import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Gallery from './Gallery.svelte';
import ResizeZoom from './ResizeZoom.svelte';
import ZoomProbe from './ZoomProbe.svelte';
import type { Lightbox } from '#lib';
import { usedRadius } from '#lib/lightbox/morph.js';

const counter = () => document.querySelector('[data-ramka-counter]')?.textContent?.trim();

test('opens from a trigger, navigates, and returns focus on Escape', async () => {
  render(Gallery);
  const trigger = page.getByRole('button', { name: 'Open Zwei' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Viewer' });
  await expect.element(dialog).toHaveAttribute('data-open');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(counter).toBe('2 / 3');
  await expect.element(page.getByText('Zwei', { exact: true }).first()).toBeInTheDocument();
  expect(document.querySelector('[data-ramka-caption]')?.hasAttribute('data-has-caption')).toBe(true);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect.poll(counter).toBe('3 / 3');
  await expect.element(page.getByRole('button', { name: 'Next' })).toHaveAttribute('data-disabled');

  await userEvent.keyboard('{Escape}');
  await expect.poll(() => document.querySelector('[data-ramka-content]')).toBeNull();
  await expect.poll(() => document.activeElement?.getAttribute('aria-label')).toBe('Open Zwei');
});

test('wires thumbnails as tabs controlling item panels', async () => {
  render(Gallery);
  await page.getByRole('button', { name: 'Open Eins' }).click();
  const tab = page.getByRole('tab', { name: 'Drei' });
  await expect.element(page.getByRole('tab', { name: 'Eins' })).toHaveAttribute('aria-selected', 'true');
  const panelId = tab.element().getAttribute('aria-controls')!;
  expect(document.getElementById(panelId)?.getAttribute('role')).toBe('tabpanel');
  await tab.click();
  await expect.poll(counter).toBe('3 / 3');
  await userEvent.keyboard('{Home}');
  await expect.poll(counter).toBe('1 / 3');
  await expect.element(page.getByRole('tab', { name: 'Eins' })).toHaveFocus();
});

test('mirrors arrow keys in RTL', async () => {
  render(Gallery, { dir: 'rtl' });
  await page.getByRole('button', { name: 'Open Eins' }).click();
  await expect.element(page.getByRole('dialog')).toHaveAttribute('data-open');
  await userEvent.keyboard('{ArrowLeft}');
  await expect.poll(counter).toBe('2 / 3');
  expect(document.querySelector('[data-ramka-content]')?.closest('[dir]')?.getAttribute('dir')).toBe('rtl');
});

test('zoom buttons step and report their bounds', async () => {
  render(Gallery);
  await page.getByRole('button', { name: 'Open Eins' }).click();
  const zoomOut = page.getByRole('button', { name: 'Zoom out' });
  await expect.element(zoomOut).toBeDisabled();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(() => document.querySelector('[data-ramka-content]')?.hasAttribute('data-zoomed')).toBe(true);
  await expect.element(zoomOut).toBeEnabled();
  await userEvent.keyboard('0');
  await expect.poll(() => document.querySelector('[data-ramka-content]')?.hasAttribute('data-zoomed')).toBe(false);
});

test('exposes zoom state on the instance and nullable part contexts', async () => {
  const seen: Record<string, unknown> = {};
  render(ZoomProbe, { report: (name: string, value: unknown) => (seen[name] = value) });
  await expect.poll(() => seen.outside).toEqual({ item: null, trigger: null, stage: null, media: null });
  await expect.poll(() => seen.media).toEqual({ element: true, index: 0 });
  await expect.poll(() => seen.zoom).toBeTruthy();
  const zoom = seen.zoom as ReturnType<typeof Lightbox.Zoom>;
  expect([zoom.zoom, zoom.maxZoom, zoom.offsetX, zoom.offsetY, zoom.canZoomOut]).toEqual([1, 4, 0, 0, false]);
  zoom.zoomTo(2, { rapid: true, dx: 100, dy: 0 });
  await expect.poll(() => zoom.zoom).toBe(2);
  expect(zoom.canZoomOut).toBe(true);
  expect(zoom.offsetX).toBeCloseTo(-50);
  zoom.changeOffsets(-20, 0);
  await expect.poll(() => zoom.offsetX).toBeCloseTo(-30);
});

test('Escape cancels an open that waits on onBeforeOpen', async () => {
  let signal: AbortSignal | undefined;
  const changes: boolean[] = [];
  render(Gallery, {
    viewTransition: true,
    onBeforeOpen: (ctx: Lightbox.BeforeOpenContext) => {
      signal = ctx.signal;
      return new Promise<void>((resolve) => setTimeout(resolve, 400));
    },
    onOpenChange: (open: boolean) => changes.push(open),
  });
  const trigger = page.getByRole('button', { name: 'Open Zwei' });
  await trigger.click();
  await expect.poll(() => signal).toBeDefined();
  await userEvent.keyboard('{Escape}');
  expect(signal?.aborted).toBe(true);
  await new Promise((resolve) => setTimeout(resolve, 600));
  expect(document.querySelector('[data-ramka-content]')).toBeNull();
  expect(changes).toEqual([]);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('a throwing onBeforeOpen leaves the lightbox closed and ready', async () => {
  const rejections: unknown[] = [];
  const onRejection = (e: PromiseRejectionEvent) => {
    e.preventDefault();
    rejections.push(e.reason);
  };
  window.addEventListener('unhandledrejection', onRejection);
  let fail = true;
  render(Gallery, {
    viewTransition: true,
    onBeforeOpen: () => {
      if (fail) throw new Error('not ready');
    },
  });
  const trigger = page.getByRole('button', { name: 'Open Eins' });
  await trigger.click();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(document.querySelector('[data-ramka-content]')).toBeNull();
  fail = false;
  await trigger.click();
  await expect.element(page.getByRole('dialog', { name: 'Viewer' })).toHaveAttribute('data-open');
  window.removeEventListener('unhandledrejection', onRejection);
  expect(rejections).toEqual([]);
});

test('keeps zoom and pan across a viewport resize', async () => {
  await page.viewport(800, 600);
  let zoom: ReturnType<typeof Lightbox.Zoom> | undefined;
  render(ResizeZoom, { report: (z: ReturnType<typeof Lightbox.Zoom>) => (zoom = z) });
  await expect.poll(() => zoom?.maxZoom).toBe(10);
  zoom!.zoomTo(4, { rapid: true });
  await expect.poll(() => zoom!.zoom).toBe(4);
  const content = document.querySelector<HTMLElement>('[data-ramka-zoom-content]')!;
  await page.viewport(1000, 750);
  await expect.poll(() => zoom!.maxZoom).toBe(8);
  expect(zoom!.zoom).toBe(4);
  expect(content.style.transform).toContain('scale(4)');
  zoom!.changeOffsets(-20, 0);
  await expect.poll(() => zoom!.offsetX).toBeCloseTo(20);
  expect(zoom!.zoom).toBe(4);
  expect(content.style.transform).toContain('scale(4)');
});

test('rapid arrow presses each advance one slide while the track is still scrolling', async () => {
  const photos = Array.from({ length: 20 }, (_, i) => `Foto ${i + 1}`);
  render(Gallery, { photos });
  await page.getByRole('button', { name: 'Open Foto 1' }).click();
  await expect.element(page.getByRole('dialog')).toHaveAttribute('data-open');
  for (let i = 0; i < 12; i++) {
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  await expect.poll(counter).toBe('13 / 20');
  await new Promise((resolve) => setTimeout(resolve, 600));
  expect(counter()).toBe('13 / 20');
  const slides = document.querySelector<HTMLElement>('[data-ramka-slides]')!;
  expect(Math.round(slides.scrollLeft / slides.clientWidth)).toBe(12);
});

test('resolves pill radii to used pixels for the morph', () => {
  const el = document.createElement('div');
  el.style.cssText = 'width:100px;height:40px;border-radius:9999px';
  document.body.append(el);
  expect(usedRadius(el)).toBe('20px 20px 20px 20px');
  el.style.borderRadius = 'calc(infinity * 1px)';
  expect(usedRadius(el)).toBe('20px 20px 20px 20px');
  el.style.borderRadius = '8px';
  expect(usedRadius(el)).toBe('8px 8px 8px 8px');
  el.remove();
});
