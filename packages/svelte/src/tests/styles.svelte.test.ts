import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TwoRoots from './TwoRoots.svelte';

test('keeps the stylesheet when the Root that rendered the head tag unmounts', async () => {
  const props = $state({ first: true });
  render(TwoRoots, props);
  const zoom = () => document.querySelector<HTMLElement>('[data-testid="second-zoom"]')!;
  await expect.poll(() => getComputedStyle(zoom()).display).toBe('grid');
  props.first = false;
  flushSync();
  await expect.poll(() => document.querySelector('[aria-label="First"]')).toBeNull();
  expect(getComputedStyle(zoom()).display).toBe('grid');
});
