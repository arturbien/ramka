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

const ported = new Set([
  'photos-app',
  'photos-app-rtl',
  'infinite-scroll',
  'url-synced-state',
  'intercepted-routes',
  'text-message',
  'film-trailers',
  '3d-models',
]);

/** Svelte example pages: the ported React examples with their titles, SvelteKit wording where it differs. */
export const svelteExamples = lightboxExamples
  .filter(({ slug }) => ported.has(slug))
  .map(({ slug, title, description }) => ({
    slug,
    title,
    description: svelteDescriptions[slug] ?? description,
  }));
