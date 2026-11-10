import { lightboxExamples } from '../../_components/examples';
import { svelteBase } from './docs-pages';

/** Root of the Svelte example pages. */
export const svelteExamplesBase = `${svelteBase}/examples/lightbox`;

const svelteDescriptions: Record<string, string> = {
  'url-synced-state':
    'Masonry wall wired to an optional [[id]] route and SvelteKit shallow routing: every photo is a shareable URL, deep links open the viewer on that slide, swiping rewrites the URL in place, and browser Back closes the viewer.',
  'intercepted-routes':
    'The nextgram pattern with SvelteKit shallow routing: plain links whose clicks push the photo URL and open an already-open controlled lightbox over the grid. Back closes it, hard loads get a standalone photo page (one URL, two presentations).',
};

/** Svelte example pages: same slugs and titles as the React examples, SvelteKit wording where it differs. */
export const svelteExamples = lightboxExamples.map(({ slug, title, description }) => ({
  slug,
  title,
  description: svelteDescriptions[slug] ?? description,
}));
