# URL-synced state

Masonry wall wired to an optional [[id]] route and SvelteKit shallow routing: every photo is a shareable URL, deep links open the viewer on that slide, swiping rewrites the URL in place, and browser Back closes the viewer.

## Source

```tsx docs/framework/svelte/examples/lightbox/url-synced-state/[[...id]]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ExampleShell } from '../../../../../../../../_components/example-shell';
import { SvelteDemo } from '../../../../../../../../_components/svelte-demo';
import { svelteDocsPages } from '../../../../../../../../_content/svelte/docs-pages';
import { GALLERY_PAGE_TITLE, galleryPhotos, photoPageTitle } from '@/svelte/src/lib/examples/url-synced-state/photos';

interface UrlSyncedStateRouteProps {
  params: Promise<{ id?: string[] }>;
}

/** Prerender the grid plus every photo permalink. */
export function generateStaticParams() {
  return [{ id: [] }, ...galleryPhotos.map((photo) => ({ id: [photo.id] }))];
}

/** Per-photo title, description and share card on deep links. */
export async function generateMetadata({ params }: UrlSyncedStateRouteProps): Promise<Metadata> {
  const { id } = await params;
  const photo = id?.length ? galleryPhotos.find((p) => p.id === id[0]) : undefined;
  if (photo) {
    const title = photoPageTitle(photo);
    return {
      title,
      description: `${photo.alt}: a deep link straight into the lightbox, driven by a SvelteKit optional parameter and ramka's controlled open / index props.`,
      openGraph: {
        title,
        description: photo.alt,
        images: [{ url: photo.src, width: photo.width, height: photo.height, alt: photo.alt }],
      },
      twitter: { card: 'summary_large_image' },
    };
  }
  return {
    title: GALLERY_PAGE_TITLE,
    description:
      'A masonry lightbox wired to SvelteKit routing: every photo is a shareable URL. Deep links open the viewer, swipes rewrite the URL, browser Back closes it. Built with ramka.',
  };
}

export default async function SvelteUrlSyncedStatePage({ params }: UrlSyncedStateRouteProps) {
  const { id } = await params;
  if (id?.length && (id.length > 1 || !galleryPhotos.some((photo) => photo.id === id[0]))) notFound();
  return (
    <ExampleShell
      title="URL-synced state"
      description={
        <>
          Every photo in this masonry wall is its own URL, driven by a SvelteKit optional parameter: the page lives at
          an [[id]] route, and the lightbox is controlled via bind:open / bind:index on Lightbox.Root. Tapping a tile
          opens the viewer and pushes /docs/framework/svelte/examples/lightbox/url-synced-state/5 with SvelteKit shallow
          routing (goto with shallow: true), swiping rewrites that URL in place (replace: true), and the browser Back
          button closes the viewer. Loading a photo URL cold serves per-photo metadata and opens the viewer as soon as
          the page mounts: deep-link visits render the Portal in place (container=&#123;null&#125;) instead of moving it
          into document.body, and Slides ssrSlideShift paints the right photo on the first frame. Because the URL writes
          happen in the gesture callbacks, trigger taps keep the view-transition morph.
        </>
      }
      docsHref={svelteDocsPages.stateLifecycle.href}
      docsLabel="State & lifecycle docs"
    >
      <SvelteDemo id="examples/url-synced-state/Demo" />
    </ExampleShell>
  );
}
```

```svelte svelte/src/lib/examples/url-synced-state/Demo.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import Gallery from './Gallery.svelte';
  import { BASE_PATH, GALLERY_PAGE_TITLE, galleryPhotos, photoIndexFromPathname, photoPageTitle } from './photos.js';

  const COLUMN_UNITS = 120;
  const GAP_UNITS = 9;
  const span = (photo: { width: number; height: number }) =>
    Math.round((COLUMN_UNITS * photo.height) / photo.width) + GAP_UNITS;

  const pathname = $derived((page.shallow?.url ?? page.url).pathname);
  const urlIndex = $derived(photoIndexFromPathname(pathname));
  const deepLinkVisit = untrack(() => urlIndex !== -1);

  let open = $state(deepLinkVisit);
  let index = $state(untrack(() => Math.max(urlIndex, 0)));
  let written: string | undefined;
  let ssr = $state(deepLinkVisit);

  $effect.pre(() => {
    const i = urlIndex;
    if (pathname === written) return void (written = undefined);
    untrack(() => {
      open = i !== -1;
      if (i !== -1) index = i;
    });
  });

  function hydrated() {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => (ssr = false));
    });
    return () => cancelAnimationFrame(frame);
  }

  function write(path: string, push: boolean) {
    written = path;
    goto(path, { shallow: true, replace: !push });
  }

  function onOpenChange(next: boolean) {
    if (next) write(`${BASE_PATH}/${galleryPhotos[index].id}`, true);
    else write(BASE_PATH, false);
  }

  function onValueChange(next: number) {
    if (open) write(`${BASE_PATH}/${galleryPhotos[next].id}`, false);
  }
</script>

<svelte:head>
  <title>{open ? photoPageTitle(galleryPhotos[index]) : GALLERY_PAGE_TITLE}</title>
</svelte:head>

<Lightbox.Root
  bind:open
  bind:index
  {onOpenChange}
  {onValueChange}
  count={galleryPhotos.length}
  loop
  scrollTriggerIntoView={[
    { type: 'onChange', behavior: 'instant' },
    { type: 'onOpenComplete', behavior: 'instant' },
  ]}
>
  <div class="masonry" {@attach hydrated}>
    <div class="grid">
      {#each galleryPhotos as photo, i (photo.id)}
        <Lightbox.Trigger
          index={i}
          class="tile"
          style="grid-row-end: span {span(photo)}; margin-bottom: calc(var(--masonry-unit) * {GAP_UNITS})"
        >
          <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
        </Lightbox.Trigger>
      {/each}
    </div>
  </div>

  <Gallery
    items={galleryPhotos}
    ariaLabel="Gallery photos"
    captionFallback={deepLinkVisit ? galleryPhotos[index].caption : undefined}
    ssrSlideShift
    inPlace={deepLinkVisit}
    portalClass={deepLinkVisit ? ['url-synced-state-in-place', ssr && 'url-synced-state-ssr'] : undefined}
  />
</Lightbox.Root>

<style>
  .masonry {
    max-width: 42rem;
    container-type: inline-size;
  }

  .grid {
    --masonry-unit: calc(100cqw / 249);
    display: grid;
    grid-auto-flow: dense;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: var(--masonry-unit);
    column-gap: calc(var(--masonry-unit) * 9);
  }

  @media (min-width: 640px) {
    .grid {
      --masonry-unit: calc(100cqw / 378);
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .grid :global(.tile) {
    display: block;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 0.75rem;
    background: transparent;
    cursor: pointer;
  }

  .grid :global(.tile:focus-visible) {
    outline: 2px solid #2b7fff;
    outline-offset: 2px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 0.75rem;
    object-fit: cover;
    background-color: #f5f5f5;
    transition-property:
      color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity, box-shadow,
      transform, translate, scale, rotate, filter, backdrop-filter;
    transition-duration: 200ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  img:hover {
    opacity: 0.9;
  }

  :global(:is(.dark, [data-theme='dark'])) img {
    background-color: #262626;
  }
</style>
```

```svelte svelte/src/lib/examples/url-synced-state/Gallery.svelte
<script lang="ts" module>
  /** One slide of the viewer: pass the real intrinsic pixel size. */
  export interface GalleryItem {
    id: string;
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
  }
</script>

<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import X from '@lucide/svelte/icons/x';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import type { ClassValue } from 'svelte/elements';
  import './lightbox.css';

  interface Props {
    items: GalleryItem[];
    ariaLabel: string;
    captionFallback?: string;
    inPlace?: boolean;
    portalClass?: ClassValue;
    ssrSlideShift?: boolean;
  }

  let { items, ariaLabel, captionFallback, inPlace = false, portalClass, ssrSlideShift = false }: Props = $props();
</script>

<Lightbox.Portal container={inPlace ? null : undefined} class={portalClass}>
  <Lightbox.Backdrop class="url-synced-state-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} class="url-synced-state-content">
    <Lightbox.Slides
      aria-label="Full-size images"
      aria-roledescription="carousel"
      preload={3}
      {ssrSlideShift}
      class="url-synced-state-slides"
    >
      {#each items as item, i (item.id)}
        <Lightbox.Slide class="url-synced-state-slide">
          <Lightbox.Item index={i} caption={item.caption} aria-roledescription="slide">
            <Lightbox.Zoom maxZoom={6}>
              <Lightbox.Media width={item.width} height={item.height} class="url-synced-state-media">
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="eager"
                  draggable="false"
                />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      {/each}
    </Lightbox.Slides>

    <div class="url-synced-state-chrome-top url-synced-state-chrome-hide">
      <div class="url-synced-state-button-group">
        <Lightbox.ZoomOut class="url-synced-state-segment" aria-label="Zoom out">
          <ZoomOutIcon aria-hidden="true" size={16} strokeWidth={2.25} />
        </Lightbox.ZoomOut>
        <Lightbox.ZoomIn class="url-synced-state-segment url-synced-state-segment-divider" aria-label="Zoom in">
          <ZoomInIcon aria-hidden="true" size={16} strokeWidth={2.25} />
        </Lightbox.ZoomIn>
      </div>
      <Lightbox.Close class="url-synced-state-button" aria-label="Close">
        <X aria-hidden="true" size={18} strokeWidth={2.25} />
      </Lightbox.Close>
    </div>

    <div class="url-synced-state-chrome-bottom url-synced-state-chrome-hide">
      <div class="url-synced-state-placard">
        <Lightbox.Caption class="url-synced-state-caption">{captionFallback}</Lightbox.Caption>
        <Lightbox.Counter class="url-synced-state-counter">
          {#snippet children({ current, total })}{current} of {total}{/snippet}
        </Lightbox.Counter>
      </div>
      <Lightbox.ThumbnailStrip class="url-synced-state-thumbnail-strip">
        <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
          {#each items as item, i (item.id)}
            <Lightbox.Thumbnail index={i}>
              <img src={item.src} alt={item.alt} draggable="false" />
            </Lightbox.Thumbnail>
          {/each}
        </Lightbox.ThumbnailStripTrack>
        <span class="url-synced-state-thumbnail-strip-indicator" aria-hidden="true"></span>
      </Lightbox.ThumbnailStrip>
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
```

```css svelte/src/lib/examples/url-synced-state/lightbox.css
.url-synced-state-in-place {
  position: relative;
  z-index: 50;
}

.url-synced-state-ssr *,
.url-synced-state-ssr *::before,
.url-synced-state-ssr *::after {
  transition: none !important;
}

.url-synced-state-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: #fff;
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, cubic-bezier(0.16, 1, 0.3, 1));
}

:is(.dark, [data-theme='dark']) .url-synced-state-backdrop {
  background-color: #000;
}

@starting-style {
  .url-synced-state-backdrop[data-open] {
    opacity: 0;
  }
}

.url-synced-state-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.url-synced-state-backdrop[data-pulling] {
  transition: none;
}

.url-synced-state-content {
  --lightbox-inset-top: calc(4rem + env(safe-area-inset-top, 0px));
  --lightbox-inset-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  --lightbox-inset-inline: 0px;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  transition: opacity var(--lightbox-vt-duration, 360ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.url-synced-state-content[data-open] {
  opacity: 1;
}

@starting-style {
  .url-synced-state-content[data-open] {
    opacity: 0;
  }
}

@media (min-width: 768px) {
  .url-synced-state-content {
    --lightbox-inset-top: calc(4.5rem + env(safe-area-inset-top, 0px));
    --lightbox-inset-bottom: calc(8.625rem + env(safe-area-inset-bottom, 0px));
    --lightbox-inset-inline: 3rem;
  }
}

.url-synced-state-slides {
  flex: 1 1 0%;
  gap: 1.25rem;
  --lightbox-ssr-slide-gap: 1.25rem;
}

.url-synced-state-slides::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .url-synced-state-slides {
    gap: 0;
    --lightbox-ssr-slide-gap: 0px;
  }
}

.url-synced-state-slides [data-ramka-slide] {
  box-sizing: border-box;
  height: 100%;
  flex: 0 0 100%;
  min-width: 100%;
  padding-top: var(--lightbox-inset-top);
  padding-bottom: var(--lightbox-inset-bottom);
  padding-inline: var(--lightbox-inset-inline);
}

.url-synced-state-media {
  overflow: hidden;
  border-radius: 0;
}

.url-synced-state-media::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  border-radius: inherit;
}

.url-synced-state-media img {
  display: block;
  user-select: none;
}

@media (min-width: 768px) {
  .url-synced-state-media {
    border-radius: 0.5rem;
  }

  .url-synced-state-media::after {
    box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  }

  :is(.dark, [data-theme='dark']) .url-synced-state-media::after {
    box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.12);
  }
}

.url-synced-state-chrome-top {
  position: absolute;
  inset-inline-end: 0.75rem;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  z-index: 30;
  display: flex;
  gap: 0.5rem;
}

.url-synced-state-button,
.url-synced-state-button-group {
  box-sizing: border-box;
  pointer-events: auto;
  height: 2.25rem;
  border: 1px solid rgb(0 0 0 / 0.2);
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.55);
  box-shadow:
    0 0.5px 1px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.65);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  backdrop-filter: blur(40px) saturate(1.5);
}

.url-synced-state-button {
  display: inline-flex;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #171717;
  font: inherit;
  cursor: default;
  transition-property: background-color, box-shadow, transform, scale, opacity, color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.url-synced-state-button-group {
  display: none;
  align-items: stretch;
  overflow: hidden;
}

@media (min-width: 768px) {
  .url-synced-state-button-group {
    display: inline-flex;
  }
}

.url-synced-state-segment {
  position: relative;
  display: inline-flex;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #171717;
  font: inherit;
  cursor: default;
  transition-property: background-color, box-shadow, opacity, color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.url-synced-state-button:hover,
.url-synced-state-segment:hover {
  background-image: linear-gradient(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05));
}

.url-synced-state-button:active,
.url-synced-state-segment:active {
  background-image: linear-gradient(rgba(0, 0, 0, 0.09), rgba(0, 0, 0, 0.09));
}

.url-synced-state-button:active {
  scale: 0.96;
}

.url-synced-state-button:focus,
.url-synced-state-segment:focus {
  outline: none;
}

.url-synced-state-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(0 0 0 / 0.25),
    0 0.5px 1px rgba(0, 0, 0, 0.12),
    0 1px 2px rgba(0, 0, 0, 0.08),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.65);
}

.url-synced-state-segment:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.25);
}

.url-synced-state-button:disabled,
.url-synced-state-segment:disabled {
  pointer-events: none;
  opacity: 0.3;
}

.url-synced-state-segment-divider::before {
  content: '';
  position: absolute;
  top: 22%;
  bottom: 22%;
  inset-inline-start: 0;
  width: 1px;
  background-color: rgb(0 0 0 / 0.15);
}

:is(.dark, [data-theme='dark']) .url-synced-state-button,
:is(.dark, [data-theme='dark']) .url-synced-state-button-group {
  border-color: rgb(255 255 255 / 0.25);
  background-color: rgb(23 23 23 / 0.45);
  box-shadow:
    0 0 0 0.5px #000,
    0 0.5px 1px rgba(0, 0, 0, 0.45),
    0 1px 2px rgba(0, 0, 0, 0.35),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.14);
}

:is(.dark, [data-theme='dark']) .url-synced-state-button,
:is(.dark, [data-theme='dark']) .url-synced-state-segment {
  color: #fff;
}

:is(.dark, [data-theme='dark']) .url-synced-state-button:hover,
:is(.dark, [data-theme='dark']) .url-synced-state-segment:hover {
  background-image: linear-gradient(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.08));
}

:is(.dark, [data-theme='dark']) .url-synced-state-button:active,
:is(.dark, [data-theme='dark']) .url-synced-state-segment:active {
  background-image: linear-gradient(rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12));
}

:is(.dark, [data-theme='dark']) .url-synced-state-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 0.4),
    0 0 0 0.5px #000,
    0 0.5px 1px rgba(0, 0, 0, 0.45),
    0 1px 2px rgba(0, 0, 0, 0.35),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.14);
}

:is(.dark, [data-theme='dark']) .url-synced-state-segment:focus-visible {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.4);
}

:is(.dark, [data-theme='dark']) .url-synced-state-segment-divider::before {
  background-color: rgb(255 255 255 / 0.2);
}

.url-synced-state-chrome-bottom {
  box-sizing: border-box;
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-inline: 0.75rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}

.url-synced-state-placard {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.url-synced-state-caption {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  color: #171717;
}

:is(.dark, [data-theme='dark']) .url-synced-state-caption {
  color: #fafafa;
}

.url-synced-state-counter {
  font-size: 11px;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  color: #737373;
}

:is(.dark, [data-theme='dark']) .url-synced-state-counter {
  color: #a3a3a3;
}

@media (min-width: 768px) {
  .url-synced-state-counter {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
}

.url-synced-state-chrome-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .url-synced-state-chrome-hide {
    opacity: 0;
  }
}

.url-synced-state-content:is([data-pulling], [data-pull-dismissing]) .url-synced-state-chrome-hide,
.url-synced-state-content[data-zoomed] .url-synced-state-chrome-bottom.url-synced-state-chrome-hide {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.url-synced-state-content[data-zoomed] .url-synced-state-slides {
  z-index: 10;
}

.url-synced-state-content[data-zoomed] .url-synced-state-chrome-bottom {
  z-index: 0;
}

@media (max-width: 767px) {
  .url-synced-state-content[data-zoomed] .url-synced-state-chrome-top.url-synced-state-chrome-hide {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 200ms,
      visibility 0s linear 200ms;
  }
}

.url-synced-state-thumbnail-strip {
  --url-synced-state-thumb-h: 4.5rem;
  --url-synced-state-strip-fade: 40px;
  pointer-events: auto;
  display: none;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  padding-block: 0.3125rem;
  -webkit-mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--url-synced-state-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--url-synced-state-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--url-synced-state-strip-fade) * 0.75),
    #000 var(--url-synced-state-strip-fade),
    #000 calc(100% - var(--url-synced-state-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--url-synced-state-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--url-synced-state-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--url-synced-state-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
  mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--url-synced-state-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--url-synced-state-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--url-synced-state-strip-fade) * 0.75),
    #000 var(--url-synced-state-strip-fade),
    #000 calc(100% - var(--url-synced-state-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--url-synced-state-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--url-synced-state-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--url-synced-state-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
}

@media (min-width: 768px) {
  .url-synced-state-thumbnail-strip {
    display: block;
  }
}

.url-synced-state-thumbnail-strip:not([data-positioned]) {
  opacity: 0;
}

.url-synced-state-thumbnail-strip[data-positioned] {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

.url-synced-state-thumbnail-strip [data-ramka-thumbnail-strip-track] {
  display: flex;
  width: max-content;
  gap: 0.625rem;
  align-items: center;
}

.url-synced-state-thumbnail-strip [role='tab'] {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: var(--url-synced-state-thumb-h);
  height: var(--url-synced-state-thumb-h);
  flex-shrink: 0;
  overflow: hidden;
  margin: 0;
  border: 0;
  border-radius: 0.5rem;
  padding: 0;
  appearance: none;
  background: transparent;
}

.url-synced-state-thumbnail-strip [role='tab'] img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.url-synced-state-thumbnail-strip-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  width: calc(var(--url-synced-state-thumb-h) + 10px);
  height: calc(var(--url-synced-state-thumb-h) + 10px);
  border-radius: calc(0.5rem + 3px);
  border: 2px solid #000;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

:is(.dark, [data-theme='dark']) .url-synced-state-thumbnail-strip-indicator {
  border-color: #fff;
}
```

```ts svelte/src/lib/examples/url-synced-state/photos.ts
/** One photo of the URL-synced state wall; `id` is the stable URL segment. */
export interface GalleryPhoto {
  id: string;
  alt: string;
  caption: string;
  src: string;
  width: number;
  height: number;
}

/** Route of the grid; every photo lives at `${BASE_PATH}/<id>`. */
export const BASE_PATH = '/docs/framework/svelte/examples/lightbox/url-synced-state';

/** Title of the grid page. */
export const GALLERY_PAGE_TITLE = 'URL-synced state example';

/** Title of a photo's deep link, shared by the server render and the client. */
export function photoPageTitle(photo: GalleryPhoto): string {
  return `${photo.caption}: ${GALLERY_PAGE_TITLE}`;
}

const sizes: [number, number][] = [
  [800, 1200],
  [800, 533],
  [800, 800],
  [800, 1200],
  [800, 467],
  [800, 1025],
  [800, 533],
  [800, 1200],
  [800, 800],
  [800, 451],
  [800, 1161],
  [800, 800],
];

/** The photo catalogue: grid tiles, slides, prerender entries and 404s all read this one list. */
export const galleryPhotos: GalleryPhoto[] = [
  { id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge' },
  { id: '2', alt: 'Empty coastal highway', caption: 'Open road' },
  { id: '3', alt: 'Overhead of a linen breakfast table', caption: 'Slow morning' },
  { id: '4', alt: 'Narrow sunlit alley', caption: 'Warm alley' },
  { id: '5', alt: 'Wide desert dunes', caption: 'Dunes' },
  { id: '6', alt: 'Rain on a window', caption: 'Rainy glass' },
  { id: '7', alt: 'Calm lake reflection', caption: 'Still water' },
  { id: '8', alt: 'Tall concrete staircase', caption: 'Ascent' },
  { id: '9', alt: 'Close-up of dried flowers', caption: 'Pressed petals' },
  { id: '10', alt: 'Panoramic city skyline at dusk', caption: 'Dusk skyline' },
  { id: '11', alt: 'Single tree in a green field', caption: 'Lone tree' },
  { id: '12', alt: 'Textured stone wall', caption: 'Stonework' },
].map((photo, i) => ({
  ...photo,
  src: `/svelte/examples/url-synced-state/mb-${String(i + 1).padStart(2, '0')}.jpg`,
  width: sizes[i]![0],
  height: sizes[i]![1],
}));

/** `/…/url-synced-state/5` gives 4; the bare grid URL or an unknown id gives -1. */
export function photoIndexFromPathname(pathname: string): number {
  if (!pathname.startsWith(`${BASE_PATH}/`)) return -1;
  let id: string;
  try {
    id = decodeURIComponent(pathname.slice(BASE_PATH.length + 1));
  } catch {
    return -1;
  }
  return galleryPhotos.findIndex((photo) => photo.id === id);
}
```
