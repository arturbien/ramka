import { lightboxExamples } from '../_components/examples';
import { lightboxPresets } from '../(docs)/presets/presets';
import { lightboxDocsPages } from './lightbox/docs-pages';
import { svelteBase, svelteDocsPages } from './svelte/docs-pages';
import { svelteExamplesBase } from './svelte/examples';
import { sveltePresets } from './svelte/presets';

/** Frameworks the docs cover. */
export type Framework = 'react' | 'svelte';

/** Switcher order and labels. */
export const frameworks: { id: Framework; label: string; tagline: string }[] = [
  { id: 'react', label: 'React', tagline: 'The lightbox for React.' },
  { id: 'svelte', label: 'Svelte', tagline: 'The lightbox for Svelte.' },
];

/** Framework a docs pathname belongs to; everything outside the Svelte tree is React. */
export function frameworkFromPath(pathname: string): Framework {
  return pathname === svelteBase || pathname.startsWith(`${svelteBase}/`) ? 'svelte' : 'react';
}

const guidePairs: [string, string][] = [
  [lightboxDocsPages.overview.href, svelteDocsPages.overview.href],
  [lightboxDocsPages.stateLifecycle.href, svelteDocsPages.stateLifecycle.href],
  [lightboxDocsPages.composition.href, svelteDocsPages.composition.href],
  [lightboxDocsPages.nextjsImage.href, svelteDocsPages.images.href],
  [lightboxDocsPages.viewTransitions.href, svelteDocsPages.viewTransitions.href],
  [lightboxDocsPages.gestures.href, svelteDocsPages.gestures.href],
  [lightboxDocsPages.zoom.href, svelteDocsPages.zoom.href],
  [lightboxDocsPages.rtl.href, svelteDocsPages.rtl.href],
  [lightboxDocsPages.csp.href, svelteDocsPages.csp.href],
  [lightboxDocsPages.api.href, svelteDocsPages.api.href],
];

const pagePairs: [string, string][] = [
  ['/docs', svelteBase],
  ...guidePairs,
  ...lightboxPresets.map((preset, i): [string, string] => [preset.href, sveltePresets[i]!.href]),
  ...lightboxExamples.map((example): [string, string] => [
    `/examples/lightbox/${example.slug}`,
    `${svelteExamplesBase}/${example.slug}`,
  ]),
];

const hashPairs: [string, string][] = [
  ['api-use-trigger-context', 'api-get-trigger'],
  ['api-use-item-context', 'api-get-item'],
  ['api-use-media-context', 'api-get-media'],
  ['api-use-stage-context', 'api-get-stage'],
  ['hooks', 'context'],
];

function mapHash(hash: string, to: Framework) {
  const id = hash.replace(/^#/, '');
  if (!id) return '';
  const pair = hashPairs.find(([react, svelte]) => (to === 'svelte' ? react : svelte) === id);
  return `#${pair ? (to === 'svelte' ? pair[1] : pair[0]) : id}`;
}

/** The same page in the other framework, keeping the hash; unknown pages fall back to the framework root. */
export function counterpartHref(pathname: string, hash: string, to: Framework): string {
  const from = frameworkFromPath(pathname);
  if (from === to) return `${pathname}${hash}`;
  const side = from === 'svelte' ? 1 : 0;
  const pair =
    pagePairs.find((p) => p[side] === pathname) ??
    pagePairs.find((p) => p[side].includes('/examples/') && pathname.startsWith(`${p[side]}/`));
  if (!pair) return to === 'svelte' ? svelteBase : '/docs';
  return `${pair[1 - side]}${pair[side] === pathname ? mapHash(hash, to) : ''}`;
}
