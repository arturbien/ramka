import { lightboxPresets } from '../../(docs)/presets/presets';
import { svelteBase } from './docs-pages';

const ported = new Set(['default', 'twitter', 'store', 'editorial', 'stories']);

/** Svelte preset demos: the ported React presets with the same copy. */
export const sveltePresets = lightboxPresets
  .filter(({ href }) => ported.has(href.split('/').pop() ?? ''))
  .map((preset) => ({ ...preset, href: `${svelteBase}${preset.href}` }));
