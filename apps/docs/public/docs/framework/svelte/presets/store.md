# Store

A full commerce viewer: the media stage (vertical thumbnail rail, pager, corner zoom) sits beside a buy panel with price, highlights, and the add-to-cart CTA. On mobile the panel collapses into a sticky price + CTA bar, so the shopper never loses the buy button while inspecting photos. Copy the **Package** files ( `index.ts`, `Gallery.svelte`, `Trigger.svelte` + `lightbox.css`) into your design system, then wire triggers in your app. The **Example** tab shows a product card whose thumbnails swap the main image, viewer navigation synced back so the close morph lands on the visible image, and add-to-cart state shared between the card and the viewer.

## Source

```ts svelte/src/lib/presets/store/index.ts
import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, ProductInfo } from './Gallery.svelte';

/** Store skin: the library primitives with a styled Trigger and the composed commerce Gallery. */
export const Lightbox = { ...Primitives, Trigger, Gallery };
```

```svelte svelte/src/lib/presets/store/Gallery.svelte
<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    src: string;
    thumb: string;
    alt: string;
    width: number;
    height: number;
  }

  /** Product data rendered by the buy panel (desktop) and the mobile bar. */
  export interface ProductInfo {
    name: string;
    price: string;
    compareAtPrice?: string;
    badge?: string;
    description?: string;
    highlights?: string[];
    stockNote?: string;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Lightbox } from '@ramka/svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    product: ProductInfo;
    ariaLabel: string;
    ctaLabel?: string;
    onAddToCart?: () => void;
    panel?: Snippet;
  }

  let { items, product, ariaLabel, ctaLabel = 'Add to bag', onAddToCart, panel }: Props = $props();

  const multiple = $derived(items.length > 1);
</script>

{#snippet priceRow(compact: boolean)}
  <span class={compact ? 'slb-mobile-price' : 'slb-price-row'}>
    <span class="slb-price">{product.price}</span>
    {#if product.compareAtPrice}<s class="slb-compare-at">{product.compareAtPrice}</s>{/if}
  </span>
{/snippet}

<Lightbox.Portal class="slb-portal">
  <Lightbox.Backdrop class="slb-backdrop" />
  <Lightbox.Content aria-label={ariaLabel} class="slb-content">
    <Lightbox.Stage class="slb-stage">
      <Lightbox.Slides aria-label="Product images" aria-roledescription="carousel" preload={2} class="slb-slides">
        {#each items as item, i (item.id ?? i)}
          <Lightbox.Slide class="slb-slide">
            <Lightbox.Item
              index={i}
              aria-roledescription="slide"
              aria-label={multiple ? undefined : `${i + 1} of ${items.length}`}
            >
              <Lightbox.Zoom maxZoom={5}>
                <Lightbox.Media width={item.width} height={item.height} class="slb-media">
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

      <Lightbox.Close class="slb-control slb-close slb-chrome-gesture-hide" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </Lightbox.Close>

      {#if multiple}
        <Lightbox.ThumbnailGroup class="slb-rail slb-chrome-gesture-hide" aria-label="Product images">
          {#each items as item, i (item.id ?? i)}
            <Lightbox.Thumbnail index={i} class="slb-rail-thumb">
              <img src={item.thumb} alt={item.alt} draggable="false" />
            </Lightbox.Thumbnail>
          {/each}
        </Lightbox.ThumbnailGroup>

        <div class="slb-pager slb-chrome-gesture-hide">
          <Lightbox.Previous class="slb-control slb-nav" aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Lightbox.Previous>
          <Lightbox.Counter class="slb-counter" />
          <Lightbox.Next class="slb-control slb-nav" aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </Lightbox.Next>
        </div>
      {/if}

      <div class="slb-zoom-group slb-chrome-gesture-hide">
        <Lightbox.ZoomOut class="slb-control" aria-label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </Lightbox.ZoomOut>
        <Lightbox.ZoomIn class="slb-control" aria-label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3M11 8v6M8 11h6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </Lightbox.ZoomIn>
      </div>
    </Lightbox.Stage>

    <aside class="slb-panel" aria-label="Product details">
      {#if panel}
        {@render panel()}
      {:else}
        <div class="slb-panel-body">
          {#if product.badge}<span class="slb-badge">{product.badge}</span>{/if}
          <h2 class="slb-name">{product.name}</h2>
          {@render priceRow(false)}
          {#if product.description}<p class="slb-description">{product.description}</p>{/if}
          {#if product.highlights?.length}
            <ul class="slb-highlights">
              {#each product.highlights as line (line)}
                <li>{line}</li>
              {/each}
            </ul>
          {/if}
        </div>
        <div class="slb-panel-footer">
          {#if product.stockNote}<p class="slb-stock">{product.stockNote}</p>{/if}
          <button type="button" class="slb-cta" onclick={onAddToCart}>{ctaLabel}</button>
        </div>
      {/if}
    </aside>

    <div class="slb-mobile-bar">
      <div class="slb-mobile-info">
        <span class="slb-mobile-name">{product.name}</span>
        {@render priceRow(true)}
      </div>
      <button type="button" class="slb-cta slb-cta-compact" onclick={onAddToCart}>{ctaLabel}</button>
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
```

```svelte svelte/src/lib/presets/store/Trigger.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['slb-trigger', className]} {...rest} />
```

```css svelte/src/lib/presets/store/lightbox.css
.slb-portal {
  --slb-ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  --slb-panel-width: 20rem;
  --slb-mobile-bar-height: 4.25rem;
}

@media (min-width: 1280px) {
  .slb-portal {
    --slb-panel-width: 24rem;
  }
}

.slb-trigger {
  padding: 0;
  border: 0;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
}

.slb-trigger:focus {
  outline: none;
}

.slb-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.slb-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: #fff;

  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, var(--slb-ease-out));
}

:is(.dark, [data-theme='dark']) .slb-backdrop {
  background-color: #000;
}

@starting-style {
  .slb-backdrop[data-open] {
    opacity: 0;
  }
}

.slb-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.slb-backdrop[data-pulling] {
  transition: none;
}

.slb-content {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  color: #171717;
  transition: opacity var(--lightbox-vt-duration, 360ms) var(--slb-ease-out);
}

:is(.dark, [data-theme='dark']) .slb-content {
  color: #fafafa;
}

@media (min-width: 768px) {
  .slb-content {
    flex-direction: row;
  }
}

.slb-content[data-open] {
  opacity: 1;
}

@starting-style {
  .slb-content[data-open] {
    opacity: 0;
  }
}

.slb-stage {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1 1 0%;
  flex-direction: column;
  overflow: hidden;

  background-color: rgb(245 245 245 / calc(1 - var(--lightbox-pull-progress, 0)));

  --slb-inset-top: calc(3.5rem + env(safe-area-inset-top, 0px));
  --slb-inset-bottom: 3.25rem;
  --slb-inset-inline: 0px;
}

:is(.dark, [data-theme='dark']) .slb-stage {
  background-color: rgb(0 0 0 / calc(1 - var(--lightbox-pull-progress, 0)));
}

@media (min-width: 768px) {
  .slb-stage {
    --slb-inset-top: 4rem;

    --slb-inset-bottom: 5.5rem;
    --slb-inset-inline: 2rem;
  }
}

@media (min-width: 1024px) {
  .slb-stage {
    --slb-inset-inline: 6.5rem;
  }
}

.slb-slides {
  flex: 1;
  min-height: 0;
  gap: 1rem;
  scrollbar-width: none;
}

.slb-slides::-webkit-scrollbar {
  display: none;
}

.slb-slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: var(--slb-inset-top) var(--slb-inset-inline) var(--slb-inset-bottom);
}

.slb-media img {
  user-select: none;
  -webkit-user-select: none;
}

.slb-chrome-gesture-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .slb-chrome-gesture-hide {
    opacity: 0;
  }
}

.slb-content:is([data-pulling], [data-pull-dismissing]) .slb-chrome-gesture-hide,
.slb-content[data-zoomed] :is(.slb-rail, .slb-pager) {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.slb-control {
  box-sizing: border-box;
  padding: 0;
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgb(0 0 0 / 0.08);
  background-color: #fff;
  color: #171717;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  transition:
    background-color 150ms ease-out,
    border-color 150ms ease-out,
    transform 150ms ease-out,
    opacity 150ms ease-out;
  cursor: pointer;
}

.slb-control:hover {
  background-color: #f5f5f5;
}

.slb-control:active {
  transform: scale(0.96);
}

.slb-control:focus {
  outline: none;
}

.slb-control:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.slb-control:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.slb-control:disabled:active {
  transform: none;
}

.slb-control svg {
  display: block;
  width: 1.125rem;
  height: 1.125rem;
}

:is(.dark, [data-theme='dark']) .slb-control {
  border-color: rgb(255 255 255 / 0.14);
  background-color: #262626;
  color: #fafafa;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
}

:is(.dark, [data-theme='dark']) .slb-control:hover {
  background-color: #333;
}

.slb-close {
  position: absolute;
  top: calc(0.875rem + env(safe-area-inset-top, 0px));
  inset-inline-end: 0.875rem;
  z-index: 2;
}

.slb-rail {
  display: none;
}

@media (min-width: 1024px) {
  .slb-rail {
    position: absolute;
    inset-inline-start: 1.25rem;
    top: 50%;
    z-index: 1;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: calc(100% - 7rem);
    overflow-y: auto;
    scrollbar-width: none;

    padding: 0.375rem;
  }

  .slb-rail::-webkit-scrollbar {
    display: none;
  }
}

.slb-rail-thumb {
  box-sizing: border-box;
  width: 3.25rem;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  appearance: none;
  border: 1px solid rgb(0 0 0 / 0.08);
  background: #fff;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 150ms ease-out;
}

.slb-rail-thumb:hover {
  opacity: 1;
}

.slb-rail-thumb:focus {
  outline: none;
}

.slb-rail-thumb[data-active] {
  opacity: 1;
  outline: 2px solid #171717;
  outline-offset: 2px;
}

.slb-rail-thumb:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.slb-rail-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:is(.dark, [data-theme='dark']) .slb-rail-thumb {
  border-color: rgb(255 255 255 / 0.12);
  background: #171717;
}

:is(.dark, [data-theme='dark']) .slb-rail-thumb[data-active] {
  outline-color: #fafafa;
}

.slb-pager {
  position: absolute;
  bottom: 0.875rem;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

@media (min-width: 768px) {
  .slb-pager {
    bottom: 1.25rem;
  }
}

@media (max-width: 767px) {
  .slb-pager .slb-nav {
    display: none;
  }
}

.slb-nav:dir(rtl) svg {
  transform: scaleX(-1);
}

.slb-counter {
  direction: ltr;
  unicode-bidi: isolate;
}

.slb-counter {
  min-width: 3rem;
  text-align: center;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: #737373;
}

:is(.dark, [data-theme='dark']) .slb-counter {
  color: #a3a3a3;
}

.slb-zoom-group {
  display: none;
}

@media (min-width: 768px) {
  .slb-zoom-group {
    position: absolute;
    inset-inline-end: 1.25rem;
    bottom: 1.25rem;
    z-index: 1;
    display: flex;
    gap: 0.5rem;
  }
}

.slb-panel {
  display: none;
}

@media (min-width: 768px) {
  .slb-panel {
    box-sizing: border-box;
    display: flex;
    width: var(--slb-panel-width);
    flex-shrink: 0;
    flex-direction: column;
    min-height: 0;

    border-inline-start: 1px solid rgb(0 0 0 / 0.08);
    background-color: #fff;
  }

  :is(.dark, [data-theme='dark']) .slb-panel {
    border-inline-start-color: rgb(255 255 255 / 0.1);
    background-color: #171717;
  }
}

.slb-panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 2.5rem 2rem 1.5rem;
}

.slb-badge {
  display: inline-block;
  margin-bottom: 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #b45309;
}

:is(.dark, [data-theme='dark']) .slb-badge {
  color: #fbbf24;
}

.slb-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.slb-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.slb-price {
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
}

.slb-compare-at {
  font-size: 0.8125rem;
  color: #a3a3a3;
}

.slb-description {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #525252;
}

:is(.dark, [data-theme='dark']) .slb-description {
  color: #a3a3a3;
}

.slb-highlights {
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.slb-highlights li {
  position: relative;
  padding-inline-start: 1rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #525252;
}

:is(.dark, [data-theme='dark']) .slb-highlights li {
  color: #a3a3a3;
}

.slb-highlights li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  top: 0.5em;
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: #d4d4d4;
}

:is(.dark, [data-theme='dark']) .slb-highlights li::before {
  background: #525252;
}

.slb-panel-footer {
  flex-shrink: 0;
  padding: 1.25rem 2rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgb(0 0 0 / 0.06);
}

:is(.dark, [data-theme='dark']) .slb-panel-footer {
  border-top-color: rgb(255 255 255 / 0.08);
}

.slb-stock {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.875rem;
  font-size: 0.75rem;
  color: #525252;
}

:is(.dark, [data-theme='dark']) .slb-stock {
  color: #a3a3a3;
}

.slb-stock::before {
  content: '';
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: #16a34a;
}

.slb-cta {
  box-sizing: border-box;
  display: inline-flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 9999px;
  padding: 0.875rem 1.5rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  background-color: #171717;
  color: #fff;
  transition:
    background-color 150ms ease-out,
    transform 150ms ease-out;
  cursor: pointer;
}

.slb-cta:hover {
  background-color: #333;
}

.slb-cta:active {
  transform: scale(0.98);
}

.slb-cta:focus {
  outline: none;
}

.slb-cta:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

:is(.dark, [data-theme='dark']) .slb-cta {
  background-color: #fafafa;
  color: #171717;
}

:is(.dark, [data-theme='dark']) .slb-cta:hover {
  background-color: #e5e5e5;
}

.slb-mobile-bar {
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 1rem;
  min-height: var(--slb-mobile-bar-height);
  padding: 0.625rem 1rem calc(0.625rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgb(0 0 0 / 0.06);
  background-color: #fff;
}

:is(.dark, [data-theme='dark']) .slb-mobile-bar {
  border-top-color: rgb(255 255 255 / 0.1);
  background-color: #171717;
}

@media (min-width: 768px) {
  .slb-mobile-bar {
    display: none;
  }
}

.slb-mobile-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
}

.slb-mobile-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 600;
}

.slb-mobile-price {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.slb-mobile-price .slb-price {
  font-size: 0.8125rem;
}

.slb-mobile-price .slb-compare-at {
  font-size: 0.75rem;
}

.slb-cta-compact {
  width: auto;
  flex-shrink: 0;
  padding: 0.625rem 1.25rem;
  font-size: 0.8125rem;
}
```

```svelte svelte/src/lib/presets/store/Demo.svelte
<script lang="ts">
  import { Lightbox, type LightboxItem, type ProductInfo } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const product: ProductInfo = {
    name: 'Terra 27L Backpack',
    price: '$149',
    compareAtPrice: '$189',
    badge: 'New colour',
    description:
      'Waxed canvas, full-grain leather straps, and a padded 16″ laptop sleeve. Weather-ready for the daily commute or a weekend on the trail.',
    highlights: [
      'Water-resistant waxed canvas shell',
      'Padded 16″ laptop compartment',
      'Magnetic quick-access top pocket',
      'Lifetime repair guarantee',
    ],
    stockNote: 'In stock — ships in 2 days',
  };

  const photo = (id: string) => ({
    src: `/photos/store-pack-${id}.jpg`,
    thumb: `/photos/store-pack-${id}-thumb.jpg`,
  });

  const images: LightboxItem[] = [
    { ...photo('a'), alt: 'Terra 27L backpack, front view', width: 1200, height: 1500 },
    { ...photo('b'), alt: 'Terra 27L backpack, side profile', width: 1200, height: 1500 },
    { ...photo('c'), alt: 'Detail of the waxed canvas and zippers', width: 1200, height: 1200 },
    { ...photo('d'), alt: 'The backpack on a trail at golden hour', width: 1600, height: 1000 },
    {
      ...photo('e'),
      alt: 'Interior compartments, laptop sleeve visible',
      width: 1200,
      height: 1500,
    },
  ];

  let selected = $state(0);
  let added = $state(false);
  const current = $derived(images[selected]);
  const ctaLabel = $derived(added ? 'Added to bag ✓' : 'Add to bag');
</script>

<div class="store-demo">
  <Lightbox.Root loop onValueChange={(value) => (selected = value)} awaitImageDecode={false}>
    <div class="layout">
      <div class="gallery">
        <Lightbox.Trigger index={selected} class="store-demo-trigger">
          {#snippet children({ imageRef })}
            {#key current.src}
              <img
                src={current.thumb}
                alt={current.alt}
                width={current.width}
                height={current.height}
                class="main-image"
                draggable="false"
                {@attach imageRef}
              />
            {/key}
          {/snippet}
        </Lightbox.Trigger>

        <div class="thumbs" role="listbox" aria-label="Select product image">
          {#each images as img, i (img.src)}
            <button
              type="button"
              role="option"
              aria-selected={i === selected}
              aria-label={img.alt}
              class="thumb"
              data-selected={i === selected || undefined}
              onclick={() => (selected = i)}
            >
              <img src={img.thumb} alt="" draggable="false" />
            </button>
          {/each}
        </div>
      </div>

      <div class="info">
        <p class="badge">{product.badge}</p>
        <h3 class="name">{product.name}</h3>
        <p class="price">
          <span>{product.price}</span>
          <s>{product.compareAtPrice}</s>
        </p>
        <p class="description">{product.description}</p>
        <button type="button" class="cta" onclick={() => (added = true)}>{ctaLabel}</button>
      </div>
    </div>

    <CloseOnBack />
    <Lightbox.Gallery
      items={images}
      {product}
      ariaLabel="{product.name} gallery"
      {ctaLabel}
      onAddToCart={() => (added = true)}
    />
  </Lightbox.Root>
</div>

<style>
  .store-demo {
    width: 100%;
    max-width: 42rem;
    line-height: 1.5;
  }
  .layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .gallery {
    min-width: 0;
    flex: 1 1 0%;
  }
  .store-demo :global(.store-demo-trigger) {
    display: block;
    width: 100%;
    overflow: hidden;
    background-color: #f5f5f5;
  }
  .main-image {
    display: block;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  .thumbs {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .thumb {
    box-sizing: border-box;
    display: block;
    width: 3.5rem;
    height: 3.5rem;
    flex-shrink: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
    border: 1px solid #e5e5e5;
    background: transparent;
    opacity: 0.7;
    transition-property: color, background-color, border-color, outline-color, opacity, box-shadow, transform;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .thumb:hover {
    opacity: 1;
  }
  .thumb[data-selected] {
    border-color: #171717;
    opacity: 1;
  }
  .thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .info {
    width: 100%;
  }
  .badge {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #b45309;
  }
  .name {
    margin: 0.375rem 0 0;
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    color: #171717;
  }
  .price {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0.25rem 0 0;
    font-size: 15px;
  }
  .price span {
    color: #171717;
  }
  .price s {
    font-size: 13px;
    color: #a3a3a3;
  }
  .description {
    margin: 1rem 0 0;
    font-size: 0.875rem;
    line-height: 1.625;
    color: #525252;
  }
  .cta {
    box-sizing: border-box;
    width: 100%;
    margin-top: 1.5rem;
    padding: 0.625rem 1.25rem;
    border: 0;
    border-radius: 9999px;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    background-color: #171717;
    color: #fff;
    transition-property: color, background-color, border-color, outline-color, opacity, box-shadow, transform;
    transition-duration: 150ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  .cta:hover {
    background-color: #404040;
  }

  @media (min-width: 768px) {
    .layout {
      flex-direction: row;
      align-items: flex-start;
      gap: 2rem;
    }
    .info {
      width: 14rem;
      flex-shrink: 0;
    }
  }

  :global(.dark) .store-demo :global(.store-demo-trigger) {
    background-color: #262626;
  }
  :global(.dark) .thumb {
    border-color: #404040;
  }
  :global(.dark) .thumb[data-selected] {
    border-color: #f5f5f5;
  }
  :global(.dark) .badge {
    color: #fbbf24;
  }
  :global(.dark) .name {
    color: #fafafa;
  }
  :global(.dark) .price span {
    color: #f5f5f5;
  }
  :global(.dark) .description {
    color: #a3a3a3;
  }
  :global(.dark) .cta {
    background-color: #f5f5f5;
    color: #171717;
  }
  :global(.dark) .cta:hover {
    background-color: #d4d4d4;
  }
</style>
```
