/** Root of the Svelte docs; every Svelte page lives below it. */
export const svelteBase = '/docs/framework/svelte';

const guides = `${svelteBase}/lightbox`;

/** Svelte lightbox guide pages, in sidebar and pager order. */
export const svelteDocsPages = {
  overview: { href: guides, title: 'Overview' },
  stateLifecycle: { href: `${guides}/state-lifecycle`, title: 'State & lifecycle' },
  composition: { href: `${guides}/composition`, title: 'Composition' },
  images: { href: `${guides}/sveltekit-images`, title: 'SvelteKit images' },
  viewTransitions: { href: `${guides}/view-transitions`, title: 'View transitions' },
  gestures: { href: `${guides}/gestures`, title: 'Gestures' },
  zoom: { href: `${guides}/zoom`, title: 'Zoom & a11y' },
  rtl: { href: `${guides}/rtl`, title: 'RTL support' },
  csp: { href: `${guides}/csp`, title: 'Content Security Policy' },
  api: { href: `${guides}/api`, title: 'API reference' },
} as const;

/** Ordered pager trail for the Svelte lightbox guides. */
export const svelteDocsPagerOrder = Object.values(svelteDocsPages);

const api = svelteDocsPages.api.href;

/** Deep links into the Svelte API reference sections. */
export const svelteApiHref = {
  root: `${api}#api-root`,
  trigger: `${api}#api-trigger`,
  portal: `${api}#api-portal`,
  backdrop: `${api}#api-backdrop`,
  content: `${api}#api-content`,
  stage: `${api}#api-stage`,
  slides: `${api}#api-slides`,
  slide: `${api}#api-slide`,
  item: `${api}#api-item`,
  zoom: `${api}#api-zoom`,
  media: `${api}#api-media`,
  close: `${api}#api-close`,
  previous: `${api}#api-previous`,
  next: `${api}#api-next`,
  zoomIn: `${api}#api-zoom-in`,
  zoomOut: `${api}#api-zoom-out`,
  counter: `${api}#api-counter`,
  caption: `${api}#api-caption`,
  thumbnailGroup: `${api}#api-thumbnail-group`,
  thumbnail: `${api}#api-thumbnail`,
  thumbnailStrip: `${api}#api-thumbnail-strip`,
  thumbnailStripTrack: `${api}#api-thumbnail-strip-track`,
  cspProvider: `${api}#api-csp-provider`,
  createHandle: `${api}#api-create-handle`,
  zoomRef: `${api}#api-zoom-ref`,
  documentVt: `${api}#api-view-transition-document`,
  context: `${api}#context`,
  types: `${api}#types`,
} as const;
