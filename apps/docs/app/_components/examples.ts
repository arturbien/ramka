export interface ExampleLink {
  slug: string;
  title: string;
  description: string;
  /**
   * Page file for the LLM docs, relative to `app/(docs)/examples/lightbox/`.
   * Defaults to `${slug}/page.tsx`; examples whose page lives inside a dynamic
   * segment point at it here.
   */
  pagePath?: string;
  /**
   * Extra source files to embed in the example's `.md`, relative to `app/`
   * (NOT the examples dir): load-bearing skin CSS lives outside the `(docs)`
   * tree, and an example doc that omits it teaches a silently degraded copy
   * of the pattern.
   */
  extraSources?: string[];
}

export interface ExampleGroup {
  group: string;
  basePath: string;
  links: ExampleLink[];
}

export const lightboxExamples: ExampleLink[] = [
  {
    slug: 'photos-app',
    title: 'Photos app',
    description:
      'macOS Photos–style square grid under a sticky, blurred toolbar with a fade gradient and "Library" title.',
  },
  {
    slug: 'photos-app-rtl',
    title: 'Photos app (RTL)',
    description:
      'The same photos app mirrored for a right-to-left locale — dir="rtl" on Lightbox.Root mirrors navigation, the thumbnail strip, and the arrow keys.',
  },
  {
    slug: 'infinite-scroll',
    title: 'Infinite scroll',
    description:
      'An endless feed where the lightbox paginates too — one photo array drives grid tiles and slides; the grid loads pages via an IntersectionObserver sentinel, and onValueChange fetches ahead inside the open viewer, appending slides to the native scroll-snap track with a minimal Previous/Next chrome (no thumbnails).',
  },
  {
    slug: 'huge-gallery',
    title: 'Huge gallery',
    description:
      'A 5,000-photo library in one lightbox. Lightbox.VirtualSlides mounts only the slides around the active one, with spacers standing in for the rest so the native scroll-snap track keeps its full length; Root itemIds lets a photo whose slide is not mounted be opened, counted and navigated to.',
  },
  {
    slug: 'intercepted-routes',
    title: 'Intercepted routes',
    description:
      'The nextgram pattern with a morph: tiles are Triggers rendered as Links, so a click morphs the viewer open and soft-navigates to the intercepted (.)photos/[id] route in a @modal slot — Back and Forward close and reopen it, hard loads get a standalone photo page (one URL, two presentations).',
    extraSources: [
      '(docs)/examples/lightbox/intercepted-routes/layout.tsx',
      '(docs)/examples/lightbox/intercepted-routes/photo-viewer.tsx',
      '(docs)/examples/lightbox/intercepted-routes/photos.ts',
      '(docs)/examples/lightbox/intercepted-routes/@modal/default.tsx',
      '(docs)/examples/lightbox/intercepted-routes/@modal/(.)photos/[id]/page.tsx',
      '(docs)/examples/lightbox/intercepted-routes/photos/[id]/page.tsx',
    ],
  },
  {
    slug: 'shared-lightbox',
    title: 'Shared lightbox',
    description:
      'One lightbox, many galleries: a 1,000-message chat with a single Root, where each trigger carries its message as a payload. The feed is virtualized, so triggers mount and unmount as you scroll; a reveal callback on scrollTriggerIntoView brings a row back for the close morph, and "+N" grids close onto their tile.',
    extraSources: [
      '(docs)/examples/lightbox/shared-lightbox/chat-feed.tsx',
      '(docs)/examples/lightbox/shared-lightbox/chat-data.ts',
    ],
  },
  {
    slug: 'shareable-albums',
    title: 'Shareable albums',
    description:
      'A photo journal where every photo in every album has its own link, and all albums share one Root. A link renders the viewer already open from the server, with defaultPayload naming the album no Trigger was tapped for; Back and Forward reopen albums with handle.open.',
    extraSources: [
      '(docs)/examples/lightbox/shareable-albums/albums-demo.tsx',
      '(docs)/examples/lightbox/shareable-albums/albums.ts',
      // The SSR deep-link pattern is inert without these: the no-transitions
      // rule and the strip's data-positioned reveal. A copy made from the .md
      // alone would fade itself in on load and snap the strip — with no error
      // to notice. (Painting the RIGHT slide pre-hydration is library-owned:
      // `Slides ssrSlideShift`, plus the `--lightbox-ssr-slide-gap` var set in
      // the chrome next to the track's gap utilities.)
      'lightbox-demo/ssr-no-transitions.css',
      'lightbox-demo/thumbnail-strip-scroll-link.css',
    ],
  },
  {
    slug: 'curated-grid',
    title: 'Curated grid',
    description:
      "A vacation-rental cover grid showing the host's five picks from a 21-photo tour. Photos without a tile close onto the last tile through overflowItemIds, crossfading, while the five picks morph back to their own tiles.",
    extraSources: ['(docs)/examples/lightbox/curated-grid/listing-data.ts'],
  },
  {
    slug: 'film-trailers',
    title: 'Film trailers',
    description: 'Movie posters morph into a fullscreen <video> that auto-plays on becoming active.',
  },
  {
    slug: '3d-models',
    title: '3D models',
    description:
      'Three.js product grid with Lightbox.Slides — onBeforeOpen preheats GLBs before the morph; shared orbit with each trigger.',
  },
];

export const exampleGroups: ExampleGroup[] = [
  { group: 'Lightbox', basePath: '/examples/lightbox', links: lightboxExamples },
];
