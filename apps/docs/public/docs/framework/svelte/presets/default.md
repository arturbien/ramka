# Default

Plain CSS: `Gallery.svelte` and `Trigger.svelte` pair with `lightbox.css`, and `index.ts` exports the styled `Lightbox` namespace. Drop the **Package** files into a design-system entry, then compose triggers in your app. Gallery includes a top-right **Theater / Peek** toggle (desktop) to switch between full-width and aspect-sized slide tracks. The **Example** tab shows the live preview (`+N` crossfade, child `morphRef`, whole-trigger morph). It is app UI, not part of the skin.

## Source

```ts svelte/src/lib/presets/default/index.ts
import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, SlidesLayout } from './Gallery.svelte';

/** Default skin: the library primitives with a styled Trigger and the composed Gallery. */
export const Lightbox = { ...Primitives, Trigger, Gallery };
```

```svelte svelte/src/lib/presets/default/Gallery.svelte
<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    src: string;
    thumb: string;
    alt: string;
    caption?: string;
    width: number;
    height: number;
  }

  /** Bleed: one wide slide. Snug: aspect-sized card with peeking neighbours. */
  export type SlidesLayout = 'bleed' | 'snug';

  const STORAGE_KEY = 'ramka-lightbox-slides-layout';

  function readStoredLayout(): SlidesLayout | null {
    if (typeof window === 'undefined') return null;
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'snug' || value === 'bleed' ? value : null;
    } catch {
      return null;
    }
  }
</script>

<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    ariaLabel: string;
    slidesLayout?: SlidesLayout;
  }

  let { items, ariaLabel, slidesLayout = $bindable(readStoredLayout() ?? 'snug') }: Props = $props();

  const snug = $derived(slidesLayout === 'snug');
  const solo = $derived(items.length <= 1);
  const ratio = (item: LightboxItem) => item.width / item.height;

  function toggleLayout() {
    slidesLayout = snug ? 'bleed' : 'snug';
    try {
      localStorage.setItem(STORAGE_KEY, slidesLayout);
    } catch {}
  }
</script>

<Lightbox.Portal class="lb-portal">
  <Lightbox.Backdrop class="lb-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} class={['lb-content', snug && 'lb-content-snug', solo && 'lb-content-solo']}>
    {#key slidesLayout}
      <Lightbox.Slides
        aria-label="Full-size images"
        aria-roledescription="carousel"
        preload={2}
        class={['lb-slides', snug && 'lb-slides-snug']}
        style={snug && items.length
          ? `--lb-snug-ratio-start: ${ratio(items[0])}; --lb-snug-ratio-end: ${ratio(items[items.length - 1])}`
          : undefined}
      >
        {#each items as item, i (item.id ?? i)}
          <Lightbox.Slide
            class={['lb-slide', snug && 'lb-slide-snug']}
            style={snug ? `--lb-snug-ratio: ${ratio(item)}` : undefined}
          >
            <Lightbox.Item
              index={i}
              caption={item.caption ?? item.alt}
              aria-roledescription="slide"
              aria-label={solo ? `${i + 1} of ${items.length}` : undefined}
            >
              <Lightbox.Zoom maxZoom={6}>
                <Lightbox.Media width={item.width} height={item.height} class="lb-media">
                  <img
                    width={item.width}
                    height={item.height}
                    src={item.src}
                    alt={item.alt}
                    loading="eager"
                    draggable="false"
                  />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
    {/key}

    <div class="lb-top-right lb-chrome-gesture-hide">
      <button
        type="button"
        class="lb-control lb-control-md lb-control-layout"
        aria-pressed={snug}
        aria-label={snug ? 'Switch to theater layout' : 'Switch to peek layout'}
        onclick={toggleLayout}
      >
        {#if snug}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
            <rect x="8.5" y="7" width="7" height="10" rx="1.5" />
            <path d="M4 9v6M20 9v6" stroke-linecap="round" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
            <rect x="4" y="7" width="16" height="10" rx="1.5" />
          </svg>
        {/if}
      </button>
      <div class="lb-control-group lb-control-md">
        <Lightbox.ZoomOut class="lb-control lb-control-md" aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </Lightbox.ZoomOut>
        <Lightbox.ZoomIn class="lb-control lb-control-md" aria-label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </Lightbox.ZoomIn>
      </div>
      <Lightbox.Close class="lb-control" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </Lightbox.Close>
    </div>

    <div class={['lb-bottom', 'lb-chrome-gesture-hide', solo && 'lb-bottom-solo']}>
      <div class="lb-caption-group">
        <Lightbox.Caption class="lb-caption" />
        {#if !solo}
          <Lightbox.Counter class="lb-counter">
            {#snippet children({ current, total })}{current} of {total}{/snippet}
          </Lightbox.Counter>
        {/if}
      </div>
      {#if !solo}
        <Lightbox.ThumbnailStrip class="lb-thumbnail-strip lb-thumbnail-strip-desktop">
          <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
            {#each items as item, i (item.id ?? i)}
              <Lightbox.Thumbnail index={i}>
                <img src={item.thumb} alt={item.alt} draggable="false" />
              </Lightbox.Thumbnail>
            {/each}
          </Lightbox.ThumbnailStripTrack>
          {#snippet indicator()}
            <span class="lb-thumbnail-strip-indicator" aria-hidden="true"></span>
          {/snippet}
        </Lightbox.ThumbnailStrip>
      {/if}
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
```

```svelte svelte/src/lib/presets/default/Trigger.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['lb-trigger', className]} {...rest} />
```

```css svelte/src/lib/presets/default/lightbox.css
.lb-portal {
  --lb-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

.lb-trigger {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
}

.lb-trigger:focus {
  outline: none;
}

.lb-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.lb-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: #fff;
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, var(--lb-ease-out-expo));
}

:is(.dark, [data-theme='dark']) .lb-backdrop {
  background-color: #000;
}

@starting-style {
  .lb-backdrop[data-open] {
    opacity: 0;
  }
}

.lb-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.lb-backdrop[data-pulling] {
  transition: none;
}

.lb-content {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  transition: opacity var(--lightbox-vt-duration, 360ms) var(--lb-ease-out-expo);

  --lb-inset-top: calc(4rem + env(safe-area-inset-top, 0px));
  --lb-inset-bottom: calc(4rem + env(safe-area-inset-bottom, 0px));
  --lb-inset-inline: 0px;
}

@media (min-width: 768px) {
  .lb-content {
    --lb-inset-top: calc(4.5rem + env(safe-area-inset-top, 0px));
    --lb-inset-bottom: calc(8.625rem + env(safe-area-inset-bottom, 0px));
    --lb-inset-inline: 3rem;
  }

  .lb-content-solo {
    --lb-inset-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
  }

  .lb-content-snug {
    --lb-inset-inline: 2rem;
  }
}

.lb-content[data-open] {
  opacity: 1;
}

@starting-style {
  .lb-content[data-open] {
    opacity: 0;
  }
}

.lb-slides {
  flex: 1;
  gap: 1.25rem;
  scrollbar-width: none;
}

.lb-slides::-webkit-scrollbar {
  display: none;
}

@media (min-width: 768px) {
  .lb-slides {
    gap: 0;
  }
}

.lb-slide {
  box-sizing: border-box;
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  padding-top: var(--lb-inset-top);
  padding-bottom: var(--lb-inset-bottom);
  padding-inline: var(--lb-inset-inline);
}

.lb-content-snug .lb-slide {
  padding-inline: 0;
}

.lb-media {
  overflow: hidden;
}

@media (min-width: 768px) {
  .lb-media {
    border-radius: 0.5rem;
  }

  .lb-media::after {
    content: '';
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 10;
    border-radius: inherit;
    box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.1);
  }

  :is(.dark, [data-theme='dark']) .lb-media::after {
    box-shadow: inset 0 0 0 0.5px rgb(255 255 255 / 0.12);
  }
}

.lb-media img {
  user-select: none;
  -webkit-user-select: none;
}

.lb-slides-snug {
  --lb-snug-gap: 1.25rem;
  --lb-snug-width-start: min(
    calc(100cqw - 2 * var(--lb-inset-inline)),
    calc((100cqh - var(--lb-inset-top) - var(--lb-inset-bottom)) * var(--lb-snug-ratio-start, 1))
  );
  --lb-snug-width-end: min(
    calc(100cqw - 2 * var(--lb-inset-inline)),
    calc((100cqh - var(--lb-inset-top) - var(--lb-inset-bottom)) * var(--lb-snug-ratio-end, 1))
  );
  gap: var(--lb-snug-gap);
}

.lb-content-snug .lb-slide-snug {
  --lb-snug-width: min(
    calc(100cqw - 2 * var(--lb-inset-inline)),
    calc((100cqh - var(--lb-inset-top) - var(--lb-inset-bottom)) * var(--lb-snug-ratio))
  );
  z-index: 0;
}

@media (min-width: 768px) {
  .lb-content-snug .lb-slide-snug {
    flex: 0 0 auto;
    min-width: 0;
    width: var(--lb-snug-width);
  }

  .lb-slides-snug::before,
  .lb-slides-snug::after {
    content: '';
    pointer-events: none;
  }

  .lb-slides-snug::before {
    flex: 0 0 calc((100cqw - var(--lb-snug-width-start)) / 2 - var(--lb-snug-gap));
  }

  .lb-slides-snug::after {
    flex: 0 0 calc((100cqw - var(--lb-snug-width-end)) / 2 - var(--lb-snug-gap));
  }
}

@media (min-width: 768px) {
  .lb-slide-snug [data-ramka-item] {
    transition: opacity var(--lightbox-pull-snap-duration, 500ms)
      var(--lightbox-pull-snap-easing, var(--lb-ease-out-expo));
  }

  .lb-slide-snug [data-ramka-item]:not([data-active]) {
    --lb-neighbor-dim: max(var(--lightbox-pull-progress, 0), var(--lightbox-zoom-progress, 0));
    opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.85);
    filter: opacity(calc(1 - var(--lb-neighbor-dim))) blur(calc(var(--lb-neighbor-dim) * 6px));
  }

  .lb-content:is([data-pulling], [data-pull-dismissing]) .lb-slide-snug [data-ramka-item] {
    transition: none;
  }
}

.lb-content[data-zoomed] .lb-slide-snug:has([data-ramka-item][data-active]) {
  z-index: 1;
}

.lb-chrome-gesture-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .lb-chrome-gesture-hide {
    opacity: 0;
  }
}

.lb-content:is([data-pulling], [data-pull-dismissing]) .lb-chrome-gesture-hide,
.lb-content[data-zoomed] .lb-bottom {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

@media (max-width: 767px) {
  .lb-content[data-zoomed] .lb-top-right {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 200ms,
      visibility 0s linear 200ms;
  }
}

.lb-top-right {
  position: absolute;
  inset-inline-end: 0.75rem;
  top: calc(0.75rem + env(safe-area-inset-top, 0px));
  z-index: 1;
  display: flex;
  gap: 0.5rem;
}

.lb-bottom {
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-inline: 0.75rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}

.lb-bottom-solo {
  justify-content: center;
  min-height: var(--lb-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.lb-caption-group {
  display: flex;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.lb-caption {
  pointer-events: auto;
  -webkit-user-select: text;
  user-select: text;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.25;
  color: #171717;
}

:is(.dark, [data-theme='dark']) .lb-caption {
  color: #fafafa;
}

.lb-counter {
  direction: ltr;
  unicode-bidi: isolate;
}

.lb-counter {
  font-size: 0.6875rem;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  color: #737373;
}

:is(.dark, [data-theme='dark']) .lb-counter {
  color: #a3a3a3;
}

@media (min-width: 768px) {
  .lb-counter {
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

.lb-control {
  box-sizing: border-box;
  padding: 0;
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgb(0 0 0 / 0.2);
  background: rgb(255 255 255 / 0.55);
  color: #171717;
  box-shadow:
    0 0.5px 1px rgb(0 0 0 / 0.12),
    0 1px 2px rgb(0 0 0 / 0.08),
    inset 0 0.5px 0 rgb(255 255 255 / 0.65);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  backdrop-filter: blur(40px) saturate(1.5);
  transition:
    background-color 150ms ease-out,
    box-shadow 150ms ease-out,
    transform 150ms ease-out,
    opacity 150ms ease-out,
    color 150ms ease-out;
  cursor: pointer;
}

.lb-control:hover {
  background-image: linear-gradient(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.05));
}

.lb-control:active {
  transform: scale(0.96);
  background-image: linear-gradient(rgb(0 0 0 / 0.09), rgb(0 0 0 / 0.09));
}

.lb-control:focus {
  outline: none;
}

.lb-control:focus-visible {
  box-shadow:
    0 0 0 2px rgb(0 0 0 / 0.25),
    0 0.5px 1px rgb(0 0 0 / 0.12),
    0 1px 2px rgb(0 0 0 / 0.08),
    inset 0 0.5px 0 rgb(255 255 255 / 0.65);
}

.lb-control:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.lb-control:disabled:active {
  transform: none;
}

:is(.dark, [data-theme='dark']) .lb-control {
  border-color: rgb(255 255 255 / 0.25);
  background: rgb(23 23 23 / 0.45);
  color: #fff;
  box-shadow:
    0 0 0 0.5px #000,
    0 0.5px 1px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.35),
    inset 0 0.5px 0 rgb(255 255 255 / 0.14);
}

:is(.dark, [data-theme='dark']) .lb-control:hover {
  background-image: linear-gradient(rgb(255 255 255 / 0.08), rgb(255 255 255 / 0.08));
}

:is(.dark, [data-theme='dark']) .lb-control:active {
  background-image: linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.12));
}

:is(.dark, [data-theme='dark']) .lb-control:focus-visible {
  box-shadow:
    0 0 0 2px rgb(255 255 255 / 0.4),
    0 0 0 0.5px #000,
    0 0.5px 1px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.35),
    inset 0 0.5px 0 rgb(255 255 255 / 0.14);
}

.lb-control-group {
  display: inline-flex;
  align-items: stretch;
  border-radius: 9999px;
  border: 1px solid rgb(0 0 0 / 0.2);
  background: rgb(255 255 255 / 0.55);
  box-shadow:
    0 0.5px 1px rgb(0 0 0 / 0.12),
    0 1px 2px rgb(0 0 0 / 0.08),
    inset 0 0.5px 0 rgb(255 255 255 / 0.65);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  backdrop-filter: blur(40px) saturate(1.5);
  overflow: hidden;
}

.lb-control-group .lb-control {
  position: relative;
  width: 2.25rem;
  height: auto;
  border: 0;
  border-radius: 0;
  background-color: transparent;
  box-shadow: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

.lb-control-group .lb-control:active {
  transform: none;
}

.lb-control-group .lb-control:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(0 0 0 / 0.25);
}

.lb-control-group .lb-control + .lb-control::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 22%;
  bottom: 22%;
  width: 1px;
  background: rgb(0 0 0 / 0.15);
}

:is(.dark, [data-theme='dark']) .lb-control-group {
  border-color: rgb(255 255 255 / 0.25);
  background: rgb(23 23 23 / 0.45);
  box-shadow:
    0 0 0 0.5px #000,
    0 0.5px 1px rgb(0 0 0 / 0.45),
    0 1px 2px rgb(0 0 0 / 0.35),
    inset 0 0.5px 0 rgb(255 255 255 / 0.14);
}

:is(.dark, [data-theme='dark']) .lb-control-group .lb-control {
  border: 0;
  background-color: transparent;
  box-shadow: none;
}

:is(.dark, [data-theme='dark']) .lb-control-group .lb-control:focus-visible {
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.4);
}

:is(.dark, [data-theme='dark']) .lb-control-group .lb-control + .lb-control::before {
  background: rgb(255 255 255 / 0.2);
}

@media (max-width: 767px) {
  .lb-control-md {
    display: none;
  }
}

.lb-control svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.lb-control[aria-label='Close'] svg,
.lb-control-layout svg {
  width: 1.125rem;
  height: 1.125rem;
}

.lb-thumbnail-strip {
  --lb-thumb-size: 4.5rem;
  --lb-strip-fade: 40px;
  --lb-strip-mask: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--lb-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--lb-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--lb-strip-fade) * 0.75),
    #000 var(--lb-strip-fade),
    #000 calc(100% - var(--lb-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--lb-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--lb-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--lb-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
  pointer-events: auto;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  padding-block: 0.3125rem;
  -webkit-mask-image: var(--lb-strip-mask);
  mask-image: var(--lb-strip-mask);
}

@media (max-width: 767px) {
  .lb-thumbnail-strip-desktop {
    display: none;
  }
}

.lb-thumbnail-strip [data-ramka-thumbnail-strip-track] {
  display: flex;
  width: max-content;
  gap: 0.625rem;
  align-items: center;
}

.lb-thumbnail-strip [role='tab'] {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: var(--lb-thumb-size);
  height: var(--lb-thumb-size);
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

.lb-thumbnail-strip [role='tab'] img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lb-thumbnail-strip-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  width: calc(var(--lb-thumb-size) + 10px);
  height: calc(var(--lb-thumb-size) + 10px);
  border-radius: calc(0.5rem + 3px);
  border: 2px solid #000;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

:is(.dark, [data-theme='dark']) .lb-thumbnail-strip-indicator {
  border-color: #fff;
}
```

```svelte svelte/src/lib/presets/default/Demo.svelte
<script lang="ts">
  import { Lightbox, type LightboxItem } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const photo = (id: string) => ({
    src: `/photos/preset-trip-${id}.jpg`,
    thumb: `/photos/preset-trip-${id}-thumb.jpg`,
  });

  const trip: LightboxItem[] = [
    { ...photo('a'), alt: 'Maya on the ridge', caption: 'Maya Chen', width: 1200, height: 1200 },
    {
      ...photo('b'),
      alt: 'Cliffside road at sunset',
      caption: 'Cliffside road at sunset',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('c'),
      alt: 'Turquoise cove',
      caption: 'A turquoise cove',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('d'),
      alt: 'Trail through pines',
      caption: 'Through the pines',
      width: 1200,
      height: 1500,
    },
    {
      ...photo('e'),
      alt: 'Camp under the stars',
      caption: 'Camp under the stars',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('f'),
      alt: 'Morning coffee on the rocks',
      caption: 'Morning on the rocks',
      width: 1200,
      height: 1200,
    },
    {
      ...photo('g'),
      alt: 'Waterfall in the canyon',
      caption: 'Hidden waterfall',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('h'),
      alt: 'Wildflowers on the hillside',
      caption: 'Wildflower meadow',
      width: 1200,
      height: 1500,
    },
    {
      ...photo('i'),
      alt: 'Kayaks on calm water',
      caption: 'Kayak at dawn',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('j'),
      alt: 'Sunset over the lake',
      caption: 'Golden hour',
      width: 1200,
      height: 1200,
    },
    {
      ...photo('k'),
      alt: 'Boardwalk through the marsh',
      caption: 'Coastal marsh',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('l'),
      alt: 'Fire lookout tower',
      caption: 'Summit lookout',
      width: 1200,
      height: 1500,
    },
  ];

  const extra = trip.length - 4;
  const portrait = trip[0];
  const listing = trip[1];
</script>

<div class="demo preset-default-demo">
  <Lightbox.Root morphTo="closest" awaitImageDecode={false}>
    <p class="label">+N overlay with crossfade</p>
    <div class="album">
      {#each trip.slice(0, 4) as img, i (img.src)}
        {@const overlay = i === 3 && extra > 0}
        <Lightbox.Trigger index={i} crossfade={overlay ? 'both' : undefined} class="tile">
          {#snippet children({ morphRef, imageRef })}
            <span class="tile-morph corner-{i}" {@attach morphRef}>
              <img width={img.width} height={img.height} src={img.thumb} alt={img.alt} {@attach imageRef} />
              {#if overlay}
                <span class="more">+{extra}</span>
              {/if}
            </span>
          {/snippet}
        </Lightbox.Trigger>
      {/each}
    </div>
    <CloseOnBack />
    <Lightbox.Gallery items={trip} ariaLabel="Trip photos" />
  </Lightbox.Root>

  <Lightbox.Root awaitImageDecode={false}>
    <p class="label">Child morph via morphRef</p>
    <Lightbox.Trigger index={0} class="card listing">
      {#snippet children({ morphRef, imageRef })}
        <img
          class="listing-image"
          width={listing.width}
          height={listing.height}
          src={listing.thumb}
          alt={listing.alt}
          {@attach morphRef}
          {@attach imageRef}
        />
        <span class="listing-body">
          <span class="title">Cliffside cottage</span>
          <span class="meta">Big Sur, CA · Sleeps 4</span>
          <span class="price">$420 <span>night</span></span>
        </span>
      {/snippet}
    </Lightbox.Trigger>
    <CloseOnBack />
    <Lightbox.Gallery items={[{ ...listing, caption: 'Cliffside cottage · Big Sur' }]} ariaLabel="Cliffside cottage" />
  </Lightbox.Root>

  <Lightbox.Root awaitImageDecode={false}>
    <p class="label">Whole trigger morph</p>
    <Lightbox.Trigger index={0} crossfade="both" class="user">
      {#snippet children({ morphRef, imageRef })}
        <span class="card user-card" {@attach morphRef}>
          <img width={portrait.width} height={portrait.height} src={portrait.thumb} alt="" {@attach imageRef} />
          <span class="user-text">
            <span class="title">Maya Chen</span>
            <span class="meta">@mayachen</span>
            <span class="role">Photographer</span>
          </span>
        </span>
      {/snippet}
    </Lightbox.Trigger>
    <CloseOnBack />
    <Lightbox.Gallery items={[portrait]} ariaLabel="Maya Chen portrait" />
  </Lightbox.Root>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
    max-width: 28rem;
  }
  .demo img {
    display: block;
  }
  .label {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 500;
    letter-spacing: 0.025em;
    text-transform: uppercase;
    color: #737373;
  }
  .album {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 2px;
    aspect-ratio: 3 / 2;
    width: 100%;
    overflow: hidden;
    border-radius: 0.75rem;
  }
  .demo :global(.tile) {
    position: relative;
    display: block;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .tile-morph {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .corner-0 {
    border-top-left-radius: 0.75rem;
  }
  .corner-1 {
    border-top-right-radius: 0.75rem;
  }
  .corner-2 {
    border-bottom-left-radius: 0.75rem;
  }
  .corner-3 {
    border-bottom-right-radius: 0.75rem;
  }
  .tile-morph img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .more {
    pointer-events: none;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 0.5);
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
    color: #fff;
  }

  .demo :global(.card),
  .card {
    box-sizing: border-box;
    border: 1px solid #d4d4d4;
    border-radius: 1rem;
    background: #fff;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.06),
      0 4px 12px rgb(0 0 0 / 0.06);
  }
  .title {
    display: block;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: #171717;
  }
  .meta {
    display: block;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #737373;
  }

  .demo :global(.listing) {
    display: block;
    width: 100%;
    overflow: hidden;
    text-align: start;
  }
  .listing-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    border-radius: 1rem 1rem 0 0;
    object-fit: cover;
  }
  .listing-body {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: 0.75rem;
  }
  .price {
    display: block;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: #262626;
  }
  .price span {
    font-weight: 400;
    color: #737373;
  }

  .demo :global(.user) {
    display: block;
    width: 11rem;
    border-radius: 1rem;
  }
  .user-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    text-align: center;
  }
  .user-card img {
    width: 4rem;
    height: 4rem;
    border-radius: 9999px;
    object-fit: cover;
  }
  .user-text {
    min-width: 0;
  }
  .role {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #525252;
  }

  :global(.dark .preset-default-demo .card) {
    border-color: #525252;
    background: #262626;
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.4),
      0 4px 16px rgb(0 0 0 / 0.35);
  }
  :global(.dark) .title {
    color: #fafafa;
  }
  :global(.dark) .price {
    color: #e5e5e5;
  }
  :global(.dark) .role {
    color: #a3a3a3;
  }
</style>
```
