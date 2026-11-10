import { lightboxPresets } from '../../(docs)/presets/presets';
import { svelteBase } from './docs-pages';

/** Svelte preset demos, same slugs and copy as the React presets. */
export const sveltePresets = lightboxPresets.map((preset) => ({ ...preset, href: `${svelteBase}${preset.href}` }));
