# Photos app

macOS Photos–style square grid under a sticky, blurred toolbar with a fade gradient and "Library" title.

## Source

```tsx docs/framework/svelte/examples/lightbox/photos-app/page.tsx
import type { Metadata } from 'next';

import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Photos app example · Svelte',
  description:
    'A macOS Photos-style Svelte image gallery: a square grid under a sticky blurred toolbar that opens into a morphing lightbox, built with ramka.',
};

export default function SveltePhotosAppPage() {
  return <SvelteDemo id="examples/photos-app/PhotosApp" />;
}
```

```svelte svelte/src/lib/examples/photos-app/Gallery.svelte
<script lang="ts" module>
  /** One viewer item: full-size source, strip thumbnail, intrinsic size. */
  export interface GalleryItem {
    id?: string | number;
    src: string;
    thumb: string;
    alt: string;
    caption?: string;
    width: number;
    height: number;
  }
</script>

<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import X from '@lucide/svelte/icons/x';
  import ZoomIn from '@lucide/svelte/icons/zoom-in';
  import ZoomOut from '@lucide/svelte/icons/zoom-out';
  import './chrome.css';

  interface Props {
    items: GalleryItem[];
    ariaLabel: string;
    backdrop?: 'scrim' | 'solid';
    hairline?: boolean;
    maxZoom?: number;
  }

  let { items, ariaLabel, backdrop = 'scrim', hairline = true, maxZoom = 6 }: Props = $props();
  const showStrip = $derived(items.length > 1);
</script>

<Lightbox.Portal class="photos-app-lb-portal">
  <Lightbox.Backdrop class="photos-app-lb-backdrop photos-app-lb-backdrop-{backdrop}" />
  <Lightbox.Content
    aria-label={ariaLabel}
    class={['photos-app-lb-content', !showStrip && 'photos-app-lb-content-solo']}
  >
    <Lightbox.Slides
      aria-label="Full-size images"
      aria-roledescription="carousel"
      preload={3}
      class="photos-app-lb-slides"
    >
      {#each items as item, i (item.id ?? i)}
        <Lightbox.Slide class="photos-app-lb-slide">
          <Lightbox.Item
            index={i}
            caption={item.caption ?? item.alt}
            aria-roledescription="slide"
            aria-label={showStrip ? undefined : `${i + 1} of ${items.length}`}
          >
            <Lightbox.Zoom {maxZoom}>
              <Lightbox.Media
                width={item.width}
                height={item.height}
                class={['photos-app-lb-media', hairline && 'photos-app-lb-media-hairline']}
              >
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

    <div class="photos-app-lb-top photos-app-lb-chrome-hide">
      <div class="photos-app-lb-tip-anchor photos-app-lb-md">
        <div class="photos-app-lb-group">
          <Lightbox.ZoomOut class="photos-app-lb-segment" aria-label="Zoom out">
            <ZoomOut aria-hidden="true" size={16} strokeWidth={2.25} />
          </Lightbox.ZoomOut>
          <Lightbox.ZoomIn class="photos-app-lb-segment" aria-label="Zoom in">
            <ZoomIn aria-hidden="true" size={16} strokeWidth={2.25} />
          </Lightbox.ZoomIn>
        </div>
        <span class="photos-app-lb-tip photos-app-lb-tip-start" aria-hidden="true">Zoom out</span>
        <span class="photos-app-lb-tip photos-app-lb-tip-end" aria-hidden="true">Zoom in</span>
      </div>
      <div class="photos-app-lb-tip-anchor">
        <Lightbox.Close class="photos-app-lb-button" aria-label="Close">
          <X aria-hidden="true" size={18} strokeWidth={2.25} />
        </Lightbox.Close>
        <span class="photos-app-lb-tip" aria-hidden="true">Close</span>
      </div>
    </div>

    <div class={['photos-app-lb-bottom photos-app-lb-chrome-hide', !showStrip && 'photos-app-lb-bottom-solo']}>
      <div class="photos-app-lb-placard">
        <Lightbox.Caption class="photos-app-lb-caption" />
        {#if items.length > 1}
          <Lightbox.Counter class="photos-app-lb-counter photos-app-lb-counter-md-sr-only">
            {#snippet children({ current, total })}{current} of {total}{/snippet}
          </Lightbox.Counter>
        {/if}
      </div>
      {#if showStrip}
        <Lightbox.ThumbnailStrip class="photos-app-lb-thumbnail-strip">
          <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
            {#each items as item, i (item.id ?? i)}
              <Lightbox.Thumbnail index={i}>
                <img src={item.thumb} alt={item.alt} draggable="false" />
              </Lightbox.Thumbnail>
            {/each}
          </Lightbox.ThumbnailStripTrack>
          <span class="photos-app-lb-thumbnail-strip-indicator" aria-hidden="true"></span>
        </Lightbox.ThumbnailStrip>
      {/if}
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
```

```svelte svelte/src/lib/examples/photos-app/PhotosApp.svelte
<script lang="ts">
  import { flushSync } from 'svelte';
  import { Lightbox } from '@ramka/svelte';
  import Heart from '@lucide/svelte/icons/heart';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Gallery from './Gallery.svelte';
  import { photoAssets } from './photos.js';
  import './photos-app.css';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  let { dir = 'ltr' }: { dir?: 'ltr' | 'rtl' } = $props();

  const photos = photoAssets.map((asset, i) => ({
    ...asset,
    id: `photo-${i}`,
    alt: `Photo ${i + 1}`,
    caption: `July ${(i % 28) + 1}, 2024`,
    favorite: i === 0 || i === 15 || i === 24,
  }));

  const MIN_COLUMNS = 2;
  const MAX_COLUMNS = 10;
  let columns = $state(5);

  function documentDir() {
    if (dir === 'ltr') return;
    const html = document.documentElement;
    const previous = html.getAttribute('dir');
    html.setAttribute('dir', dir);
    return () => {
      if (previous === null) html.removeAttribute('dir');
      else html.setAttribute('dir', previous);
    };
  }

  function zoomTo(next: number) {
    const target = Math.min(MAX_COLUMNS, Math.max(MIN_COLUMNS, next));
    if (target === columns) return;
    if (typeof document.startViewTransition !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      columns = target;
      return;
    }
    document.startViewTransition(() => flushSync(() => (columns = target)));
  }
</script>

<div class="photos-app" {@attach documentDir}>
  <Lightbox.Root
    loop
    {dir}
    scrollTriggerIntoView={[
      { type: 'onChange', behavior: 'instant' },
      { type: 'onOpenComplete', behavior: 'instant' },
    ]}
    awaitImageDecode={false}
  >
    <CloseOnBack />
    <div>
      <div class="photos-app-toolbar">
        <div class="photos-app-heading">
          <span class="photos-app-title">Library</span>
          <span class="photos-app-subtitle">{photos.length} Photos · July 2024</span>
        </div>
        <div class="photos-app-actions">
          <div class="photos-app-capsule">
            <button
              type="button"
              class="photos-app-density"
              aria-label="Smaller photos"
              disabled={columns >= MAX_COLUMNS}
              onclick={() => zoomTo(columns + 1)}
            >
              <Minus aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              class="photos-app-density"
              aria-label="Larger photos"
              disabled={columns <= MIN_COLUMNS}
              onclick={() => zoomTo(columns - 1)}
            >
              <Plus aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div class="photos-app-grid" style:grid-template-columns="repeat({columns}, minmax(0, 1fr))">
        {#each photos as photo, i (photo.id)}
          <Lightbox.Trigger index={i} class="photos-app-lb-trigger photos-app-tile">
            {#snippet children({ imageRef })}
              <img
                {@attach imageRef}
                src={photo.thumb}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                class="photos-app-tile-image"
              />
              {#if photo.favorite}
                <Heart aria-hidden="true" class="photos-app-heart" size={16} />
              {/if}
            {/snippet}
          </Lightbox.Trigger>
        {/each}
      </div>
    </div>

    <Gallery items={photos} ariaLabel="Library photos" backdrop="solid" hairline={false} />
  </Lightbox.Root>
</div>
```

```css svelte/src/lib/examples/photos-app/chrome.css
.photos-app-lb-portal {
  --photos-app-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
}

.photos-app-lb-portal *,
.photos-app-lb-portal *::before,
.photos-app-lb-portal *::after {
  box-sizing: border-box;
}

.photos-app-lb-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, var(--photos-app-ease-out-expo));
}

@starting-style {
  .photos-app-lb-backdrop[data-open] {
    opacity: 0;
  }
}

.photos-app-lb-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.photos-app-lb-backdrop[data-pulling] {
  transition: none;
}

.photos-app-lb-backdrop-scrim {
  background-color: rgb(255 255 255 / 0.9);
}

:is(.dark, [data-theme='dark']) .photos-app-lb-backdrop-scrim {
  background-color: rgb(0 0 0 / 0.9);
}

.photos-app-lb-backdrop-solid {
  background-color: #fff;
}

:is(.dark, [data-theme='dark']) .photos-app-lb-backdrop-solid {
  background-color: #000;
}

.photos-app-lb-content {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  transition: opacity var(--lightbox-vt-duration, 360ms) var(--photos-app-ease-out-expo);

  --photos-app-inset-top: calc(4rem + env(safe-area-inset-top, 0px));
  --photos-app-inset-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  --photos-app-inset-inline: 0px;
}

@media (min-width: 768px) {
  .photos-app-lb-content {
    --photos-app-inset-top: calc(4.5rem + env(safe-area-inset-top, 0px));
    --photos-app-inset-bottom: calc(8.625rem + env(safe-area-inset-bottom, 0px));
    --photos-app-inset-inline: 3rem;
  }

  .photos-app-lb-content-solo {
    --photos-app-inset-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.photos-app-lb-content[data-open] {
  opacity: 1;
}

@starting-style {
  .photos-app-lb-content[data-open] {
    opacity: 0;
  }
}

.photos-app-lb-slides {
  flex: 1;
  gap: 1.25rem;
  scrollbar-width: none;
}

.photos-app-lb-slides::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .photos-app-lb-slides {
    gap: 0;
  }
}

.photos-app-lb-slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  padding-top: var(--photos-app-inset-top);
  padding-bottom: var(--photos-app-inset-bottom);
  padding-inline: var(--photos-app-inset-inline);
}

.photos-app-lb-media {
  overflow: hidden;
}

.photos-app-lb-media img {
  display: block;
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 768px) {
  .photos-app-lb-media {
    border-radius: 0.5rem;
  }

  .photos-app-lb-media-hairline::after {
    content: '';
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 10;
    border-radius: inherit;
    box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.1);
  }

  :is(.dark, [data-theme='dark']) .photos-app-lb-media-hairline::after {
    box-shadow: inset 0 0 0 0.5px rgb(255 255 255 / 0.12);
  }
}

.photos-app-lb-chrome-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .photos-app-lb-chrome-hide {
    opacity: 0;
  }
}

.photos-app-lb-content:is([data-pulling], [data-pull-dismissing]) .photos-app-lb-chrome-hide,
.photos-app-lb-content[data-zoomed] .photos-app-lb-bottom.photos-app-lb-chrome-hide {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.photos-app-lb-content[data-zoomed] .photos-app-lb-slides {
  z-index: 10;
}

.photos-app-lb-content[data-zoomed] .photos-app-lb-bottom {
  z-index: 0;
}

@media (max-width: 767px) {
  .photos-app-lb-content[data-zoomed] .photos-app-lb-top.photos-app-lb-chrome-hide {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 200ms,
      visibility 0s linear 200ms;
  }
}

.photos-app-lb-top {
  position: absolute;
  inset-inline-end: 0.75rem;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  z-index: 30;
  display: flex;
  gap: 0.5rem;
}

.photos-app-lb-bottom {
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

.photos-app-lb-bottom-solo {
  justify-content: center;
  min-height: var(--photos-app-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.photos-app-lb-placard {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.photos-app-lb-caption {
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

:is(.dark, [data-theme='dark']) .photos-app-lb-caption {
  color: #fafafa;
}

.photos-app-lb-counter {
  font-size: 11px;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  color: #737373;
}

:is(.dark, [data-theme='dark']) .photos-app-lb-counter {
  color: #a3a3a3;
}

@media (min-width: 768px) {
  .photos-app-lb-counter-md-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
}

.photos-app-lb-button,
.photos-app-lb-group {
  pointer-events: auto;
  height: 2.25rem;
  border-radius: 9999px;
  border: 1px solid rgb(0 0 0 / 0.2);
  background-color: rgb(255 255 255 / 0.55);
  box-shadow:
    0 0.5px 1px rgb(0 0 0 / 0.12),
    0 1px 2px rgb(0 0 0 / 0.08),
    inset 0 0.5px 0 rgb(255 255 255 / 0.65);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  backdrop-filter: blur(40px) saturate(1.5);
}

:is(.dark, [data-theme='dark']) :is(.photos-app-lb-button, .photos-app-lb-group) {
  border-color: rgb(255 255 255 / 0.25);
  background-color: rgb(23 23 23 / 0.45);
  box-shadow:
    0 0 0 0.5px #000,
    0 0.5px 1px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.35),
    inset 0 0.5px 0 rgb(255 255 255 / 0.14);
}

.photos-app-lb-button,
.photos-app-lb-segment {
  margin: 0;
  padding: 0;
  font: inherit;
  appearance: none;
  display: inline-flex;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #171717;
  cursor: pointer;
  transition-property: background-color, box-shadow, transform, opacity, color;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.photos-app-lb-button:hover,
.photos-app-lb-segment:hover {
  background-image: linear-gradient(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.05));
}

.photos-app-lb-button:active,
.photos-app-lb-segment:active {
  background-image: linear-gradient(rgb(0 0 0 / 0.09), rgb(0 0 0 / 0.09));
}

.photos-app-lb-button:active {
  transform: scale(0.96);
}

.photos-app-lb-button:focus,
.photos-app-lb-segment:focus {
  outline: none;
}

.photos-app-lb-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(0 0 0 / 0.25),
    0 0.5px 1px rgb(0 0 0 / 0.12),
    0 1px 2px rgb(0 0 0 / 0.08),
    inset 0 0.5px 0 rgb(255 255 255 / 0.65);
}

.photos-app-lb-segment:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(0 0 0 / 0.25);
}

.photos-app-lb-button:disabled,
.photos-app-lb-segment:disabled {
  pointer-events: none;
  opacity: 0.3;
}

:is(.dark, [data-theme='dark']) :is(.photos-app-lb-button, .photos-app-lb-segment) {
  color: #fff;
}

:is(.dark, [data-theme='dark']) :is(.photos-app-lb-button, .photos-app-lb-segment):hover {
  background-image: linear-gradient(rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.08));
}

:is(.dark, [data-theme='dark']) :is(.photos-app-lb-button, .photos-app-lb-segment):active {
  background-image: linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.12));
}

:is(.dark, [data-theme='dark']) .photos-app-lb-button:focus-visible {
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 0.4),
    0 0 0 0.5px #000,
    0 0.5px 1px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.35),
    inset 0 0.5px 0 rgb(255 255 255 / 0.14);
}

:is(.dark, [data-theme='dark']) .photos-app-lb-segment:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.4);
}

.photos-app-lb-group {
  display: inline-flex;
  align-items: stretch;
  overflow: hidden;
}

.photos-app-lb-segment {
  position: relative;
  border: 0;
  background-color: transparent;
}

.photos-app-lb-segment + .photos-app-lb-segment::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 22%;
  bottom: 22%;
  width: 1px;
  background: rgb(0 0 0 / 0.15);
}

:is(.dark, [data-theme='dark']) .photos-app-lb-segment + .photos-app-lb-segment::before {
  background: rgb(255 255 255 / 0.2);
}

.photos-app-lb-tip-anchor {
  position: relative;
  display: inline-flex;
}

.photos-app-lb-tip {
  pointer-events: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  z-index: 50;
  width: max-content;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  line-height: 1rem;
  background: var(--foreground, oklch(0.145 0 0));
  color: var(--background, #fff);
  opacity: 0;
  transform: translateX(-50%) scale(0.95);
  transform-origin: top center;
  transition:
    opacity 100ms ease-out,
    transform 100ms ease-out;
}

.photos-app-lb-tip::before {
  content: '';
  position: absolute;
  top: 0.25rem;
  left: 50%;
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 2px;
  background: inherit;
  transform: translate(-50%, calc(-50% - 2px - 0.25rem)) rotate(45deg);
}

.photos-app-lb-tip-start {
  left: 25%;
}

.photos-app-lb-tip-end {
  left: 75%;
}

@media (hover: hover) {
  .photos-app-lb-tip-anchor:has(> :enabled:hover) > .photos-app-lb-tip,
  .photos-app-lb-tip-anchor:has(.photos-app-lb-segment:first-child:enabled:hover) > .photos-app-lb-tip-start,
  .photos-app-lb-tip-anchor:has(.photos-app-lb-segment:last-child:enabled:hover) > .photos-app-lb-tip-end {
    opacity: 1;
    transform: translateX(-50%) scale(1);
    transition-delay: 600ms;
  }
}

.photos-app-lb-thumbnail-strip {
  --photos-app-thumb-size: 4.5rem;
  --photos-app-strip-fade: 40px;
  --photos-app-strip-mask: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--photos-app-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--photos-app-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--photos-app-strip-fade) * 0.75),
    #000 var(--photos-app-strip-fade),
    #000 calc(100% - var(--photos-app-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--photos-app-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--photos-app-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--photos-app-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
  pointer-events: auto;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  padding-block: 0.3125rem;
  -webkit-mask-image: var(--photos-app-strip-mask);
  mask-image: var(--photos-app-strip-mask);
}

@media (max-width: 767px) {
  .photos-app-lb-thumbnail-strip {
    display: none;
  }
}

.photos-app-lb-thumbnail-strip:not([data-positioned]) {
  opacity: 0;
}

.photos-app-lb-thumbnail-strip[data-positioned] {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

.photos-app-lb-thumbnail-strip [data-ramka-thumbnail-strip-track] {
  display: flex;
  width: max-content;
  gap: 0.625rem;
  align-items: center;
}

.photos-app-lb-thumbnail-strip [role='tab'] {
  position: relative;
  display: block;
  width: var(--photos-app-thumb-size);
  height: var(--photos-app-thumb-size);
  flex-shrink: 0;
  overflow: hidden;
  margin: 0;
  border: 0;
  border-radius: 0.5rem;
  padding: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.photos-app-lb-thumbnail-strip [role='tab'] img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.photos-app-lb-thumbnail-strip-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--photos-app-thumb-size) + 10px);
  height: calc(var(--photos-app-thumb-size) + 10px);
  border-radius: calc(0.5rem + 3px);
  border: 2px solid #000;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

:is(.dark, [data-theme='dark']) .photos-app-lb-thumbnail-strip-indicator {
  border-color: #fff;
}

.photos-app-lb-trigger {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
}

.photos-app-lb-trigger:focus {
  outline: none;
}

.photos-app-lb-trigger:focus-visible {
  outline: 2px solid oklch(62.3% 0.214 259.815);
  outline-offset: 2px;
}

@media (max-width: 767px) {
  .photos-app-lb-md {
    display: none;
  }
}
```

```css svelte/src/lib/examples/photos-app/photos-app.css
.photos-app {
  min-height: 100vh;
  user-select: none;
  -webkit-user-select: none;
}

.photos-app-toolbar {
  view-transition-name: photos-toolbar;
  pointer-events: auto;
  position: sticky;
  top: 3.5rem;
  z-index: 30;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgb(0 0 0 / 0.06);
  background-color: var(--background, #fff);
  padding: 0.625rem 1rem;
}

:is(.dark, [data-theme='dark']) .photos-app-toolbar {
  border-bottom-color: rgb(255 255 255 / 0.08);
}

@media (min-width: 768px) {
  .photos-app-toolbar {
    top: 0;
  }
}

.photos-app-heading {
  display: flex;
  flex-direction: column;
}

.photos-app-title {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.5rem;
  letter-spacing: -0.025em;
  color: #171717;
}

.photos-app-subtitle {
  font-size: 11px;
  font-weight: 500;
  line-height: 1rem;
  color: #737373;
}

:is(.dark, [data-theme='dark']) .photos-app-title {
  color: #fafafa;
}

:is(.dark, [data-theme='dark']) .photos-app-subtitle {
  color: #a3a3a3;
}

.photos-app-actions {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
}

.photos-app-capsule {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  border-radius: 9999px;
  background-color: rgb(0 0 0 / 0.05);
  padding: 0.125rem;
}

:is(.dark, [data-theme='dark']) .photos-app-capsule {
  background-color: rgb(255 255 255 / 0.09);
}

.photos-app-density {
  margin: 0;
  padding: 0;
  border: 0;
  background-color: transparent;
  font: inherit;
  appearance: none;
  display: inline-flex;
  width: 1.75rem;
  height: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: #525252;
  cursor: pointer;
  transition-property: color, background-color, opacity;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.photos-app-density:hover {
  background-color: rgb(0 0 0 / 0.05);
}

.photos-app-density:disabled {
  pointer-events: none;
  opacity: 0.3;
}

:is(.dark, [data-theme='dark']) .photos-app-density {
  color: #d4d4d4;
}

:is(.dark, [data-theme='dark']) .photos-app-density:hover {
  background-color: rgb(255 255 255 / 0.1);
}

.photos-app-grid {
  view-transition-name: photos-grid;
  display: grid;
  gap: 0.125rem;
}

.photos-app-tile {
  position: relative;
  display: block;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

@media (min-width: 768px) {
  .photos-app-tile {
    scroll-margin-top: 4rem;
  }
}

.photos-app-tile-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photos-app-heart {
  pointer-events: none;
  position: absolute;
  bottom: 0.375rem;
  inset-inline-start: 0.375rem;
  fill: #fff;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
```

```ts svelte/src/lib/examples/photos-app/photos.ts
/** A local photo: full-size source, a lighter grid thumbnail, and its intrinsic pixel size. */
export interface PhotoAsset {
  src: string;
  thumb: string;
  width: number;
  height: number;
}

const sizes: [number, number][] = [
  [1600, 1067],
  [1067, 1600],
  [1600, 1600],
  [1600, 900],
  [1200, 1600],
  [1600, 1200],
];

/** The 48 demo photos shared by the photos app and the infinite feed. */
export const photoAssets: PhotoAsset[] = Array.from({ length: 48 }, (_, i) => {
  const [width, height] = sizes[i % sizes.length];
  return {
    src: `/svelte/examples/photos-app/full/ramka-photos-${i}.jpg`,
    thumb: `/svelte/examples/photos-app/thumb/ramka-photos-${i}.jpg`,
    width,
    height,
  };
});
```
