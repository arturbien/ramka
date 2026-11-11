# Editorial

The viewer newsrooms use for article figures: a near-black surface in both color schemes, a typography-forward caption and credit block under the media, and ghost controls. Keyboard-first, no zoom: a reading context, not an inspection one. Copy the **Package** files ( `index.ts`, the `.svelte` parts and `lightbox.css`) into your design system, then wire triggers in your app. The **Example** tab shows an article excerpt whose inline figures open the viewer with their caption and credit.

## Source

```ts svelte/src/lib/presets/editorial/index.ts
import { Lightbox as Primitives } from '@ramka/svelte';
import Backdrop from './Backdrop.svelte';
import Caption from './Caption.svelte';
import Close from './Close.svelte';
import Content from './Content.svelte';
import Counter from './Counter.svelte';
import Gallery from './Gallery.svelte';
import Item from './Item.svelte';
import Media from './Media.svelte';
import Next from './Next.svelte';
import Portal from './Portal.svelte';
import Previous from './Previous.svelte';
import Slide from './Slide.svelte';
import Slides from './Slides.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem } from './Gallery.svelte';

/** Editorial skin: newsroom figure viewer with styled parts and the composed Gallery. */
export const Lightbox = {
  Root: Primitives.Root,
  Trigger,
  Portal,
  Backdrop,
  Content,
  Close,
  Slides,
  Slide,
  Item,
  Media,
  Counter,
  Caption,
  Previous,
  Next,
  Gallery,
};
```

```svelte svelte/src/lib/presets/editorial/Gallery.svelte
<script lang="ts" module>
  /** Item shape for the Gallery: pass the real intrinsic pixel size. */
  export interface LightboxItem {
    id?: string | number;
    src: string;
    thumb?: string;
    alt: string;
    caption?: string;
    credit?: string;
    width: number;
    height: number;
  }
</script>

<script lang="ts">
  import Backdrop from './Backdrop.svelte';
  import Caption from './Caption.svelte';
  import Close from './Close.svelte';
  import Content from './Content.svelte';
  import Counter from './Counter.svelte';
  import Item from './Item.svelte';
  import Media from './Media.svelte';
  import Next from './Next.svelte';
  import Portal from './Portal.svelte';
  import Previous from './Previous.svelte';
  import Slide from './Slide.svelte';
  import Slides from './Slides.svelte';
  import './lightbox.css';

  interface Props {
    items: LightboxItem[];
    ariaLabel: string;
  }

  let { items, ariaLabel }: Props = $props();

  const multiple = $derived(items.length > 1);
</script>

<Portal>
  <Backdrop />
  <Content aria-label={ariaLabel}>
    <Slides aria-label="Article photographs" aria-roledescription="carousel" preload={2}>
      {#each items as item, i (item.id ?? i)}
        {#snippet figureCaption()}
          {#if item.caption}<span class="elb-caption-text">{item.caption}</span>{/if}
          {#if item.credit}<span class="elb-credit">{item.credit}</span>{/if}
        {/snippet}
        <Slide>
          <Item
            index={i}
            caption={item.caption || item.credit ? figureCaption : undefined}
            aria-roledescription="slide"
            aria-label="{i + 1} of {items.length}"
          >
            <Media width={item.width} height={item.height}>
              <img
                width={item.width}
                height={item.height}
                src={item.src}
                alt={item.alt}
                loading="eager"
                draggable="false"
              />
            </Media>
          </Item>
        </Slide>
      {/each}
    </Slides>

    <div class="elb-top elb-chrome-gesture-hide">
      {#if multiple}
        <Counter>
          {#snippet children({ current, total })}{current} / {total}{/snippet}
        </Counter>
      {:else}
        <span></span>
      {/if}
      <Close />
    </div>

    {#if multiple}
      <Previous class="elb-chrome-gesture-hide" />
      <Next class="elb-chrome-gesture-hide" />
    {/if}

    <div class="elb-bottom elb-chrome-gesture-hide">
      <Caption />
    </div>
  </Content>
</Portal>
```

```svelte svelte/src/lib/presets/editorial/Trigger.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['elb-trigger', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Portal.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Portal> = $props();
</script>

<Lightbox.Portal class={['elb-portal', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Backdrop.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Backdrop> = $props();
</script>

<Lightbox.Backdrop class={['elb-backdrop', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Content.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Content> = $props();
</script>

<Lightbox.Content class={['elb-content', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Slides.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Slides> = $props();
</script>

<Lightbox.Slides class={['elb-slides', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Slide.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Slide> = $props();
</script>

<Lightbox.Slide class={['elb-slide', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Item.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Item> = $props();
</script>

<Lightbox.Item class={['elb-item', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Media.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Media> = $props();
</script>

<Lightbox.Media class={['elb-media', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Counter.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Counter> = $props();
</script>

<Lightbox.Counter class={['elb-counter', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Caption.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Caption> = $props();
</script>

<Lightbox.Caption class={['elb-caption', className]} {...rest} />
```

```svelte svelte/src/lib/presets/editorial/Close.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Close> = $props();
</script>

<Lightbox.Close class={['elb-control', className]} aria-label="Close" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Close>
```

```svelte svelte/src/lib/presets/editorial/Previous.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Previous> = $props();
</script>

<Lightbox.Previous class={['elb-control', 'elb-nav', 'elb-nav-prev', className]} aria-label="Previous" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Previous>
```

```svelte svelte/src/lib/presets/editorial/Next.svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Next> = $props();
</script>

<Lightbox.Next class={['elb-control', 'elb-nav', 'elb-nav-next', className]} aria-label="Next" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Next>
```

```css svelte/src/lib/presets/editorial/lightbox.css
.elb-portal {
  --elb-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}

.elb-trigger {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  appearance: none;
  cursor: pointer;
}

.elb-trigger:focus {
  outline: none;
}

.elb-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.elb-backdrop {
  position: fixed;
  inset: 0;
  opacity: 0;
  background-color: #0a0a0a;
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, var(--elb-ease-out));
}

@starting-style {
  .elb-backdrop[data-open] {
    opacity: 0;
  }
}

.elb-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.elb-backdrop[data-pulling] {
  transition: none;
}

.elb-content {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overscroll-behavior: contain;
  outline: none;
  opacity: 0;
  color: #fafafa;
  transition: opacity var(--lightbox-vt-duration, 360ms) var(--elb-ease-out);

  --elb-inset-top: calc(3.5rem + env(safe-area-inset-top, 0px));
  --elb-inset-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
  --elb-inset-inline: 1rem;
}

@media (min-width: 768px) {
  .elb-content {
    --elb-inset-top: calc(4rem + env(safe-area-inset-top, 0px));
    --elb-inset-bottom: calc(6.5rem + env(safe-area-inset-bottom, 0px));
    --elb-inset-inline: 5rem;
  }
}

.elb-content[data-open] {
  opacity: 1;
}

@starting-style {
  .elb-content[data-open] {
    opacity: 0;
  }
}

.elb-slides {
  flex: 1;
  min-height: 0;
  gap: 1rem;
  scrollbar-width: none;
}

.elb-slides::-webkit-scrollbar {
  display: none;
}

.elb-slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: var(--elb-inset-top) var(--elb-inset-inline) var(--elb-inset-bottom);
}

.elb-item {
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
}

.elb-media img {
  display: block;
  user-select: none;
  -webkit-user-select: none;
}

.elb-chrome-gesture-hide {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

@starting-style {
  .elb-chrome-gesture-hide {
    opacity: 0;
  }
}

.elb-content:is([data-pulling], [data-pull-dismissing]) .elb-chrome-gesture-hide {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}

.elb-top {
  position: absolute;
  inset-inline: 0;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(0.875rem + env(safe-area-inset-top, 0px)) 1rem 0;
}

.elb-counter {
  direction: ltr;
  unicode-bidi: isolate;
}

.elb-counter {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgb(255 255 255 / 0.55);
}

.elb-bottom {
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding-inline: 1.25rem;
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
}

.elb-caption {
  pointer-events: auto;
  -webkit-user-select: text;
  user-select: text;
  display: flex;
  max-width: 42rem;
  flex-direction: column;
  gap: 0.375rem;
  text-align: center;
}

.elb-caption-text {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgb(255 255 255 / 0.92);
}

.elb-credit {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.45);
}

.elb-control {
  box-sizing: border-box;
  padding: 0;
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 0;
  background-color: transparent;
  color: rgb(255 255 255 / 0.8);
  transition:
    background-color 150ms ease-out,
    color 150ms ease-out,
    opacity 150ms ease-out,
    transform 150ms ease-out;
  cursor: pointer;
}

.elb-control:hover {
  background-color: rgb(255 255 255 / 0.1);
  color: #fff;
}

.elb-control:active {
  transform: scale(0.96);
}

.elb-control:focus {
  outline: none;
}

.elb-control:focus-visible {
  outline: 2px solid rgb(255 255 255 / 0.6);
  outline-offset: 2px;
}

.elb-control:disabled {
  cursor: not-allowed;
  opacity: 0.25;
}

.elb-control:disabled:active {
  transform: none;
}

.elb-control svg {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}

.elb-nav {
  position: absolute;
  top: 50%;
  z-index: 1;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
}

.elb-nav:active {
  transform: translateY(-50%) scale(0.96);
}

.elb-nav:disabled:active {
  transform: translateY(-50%);
}

.elb-nav-prev {
  inset-inline-start: 1rem;
}

.elb-nav-next {
  inset-inline-end: 1rem;
}

.elb-nav:dir(rtl) svg {
  transform: scaleX(-1);
}

@media (max-width: 767px) {
  .elb-nav {
    display: none;
  }
}
```

```svelte svelte/src/lib/presets/editorial/Demo.svelte
<script lang="ts">
  import { Lightbox, type LightboxItem } from './index.js';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const photo = (name: string) => ({
    src: `/photos/edit-${name}.jpg`,
    thumb: `/photos/edit-${name}-thumb.jpg`,
  });

  const figures: LightboxItem[] = [
    {
      ...photo('harbor'),
      alt: 'The old harbor at dawn, boats resting in still water',
      caption: 'The old harbor at dawn. Most of the fleet has not left the quay in a decade.',
      credit: 'Photograph: Anna Beck',
      width: 1600,
      height: 1000,
    },
    {
      ...photo('nets'),
      alt: 'Fishing nets stacked on the pier',
      caption: 'Nets stacked on the pier — mended each winter, used less each spring.',
      credit: 'Photograph: Anna Beck',
      width: 1000,
      height: 1400,
    },
    {
      ...photo('market'),
      alt: 'The near-empty fish market hall in the early morning',
      caption: 'The market hall opens at five. By seven, the day’s catch is gone.',
      credit: 'Photograph: Jonas Ravn',
      width: 1600,
      height: 1000,
    },
  ];
</script>

{#snippet figure(index: number)}
  {@const item = figures[index]}
  <figure>
    <Lightbox.Trigger {index} class="editorial-demo-trigger">
      <span class="morph" data-ramka-morph>
        <img src={item.thumb} alt={item.alt} width={item.width} height={item.height} draggable="false" />
      </span>
    </Lightbox.Trigger>
    <figcaption>
      {item.caption} <span class="credit">{item.credit}</span>
    </figcaption>
  </figure>
{/snippet}

<article class="editorial-demo">
  <Lightbox.Root
    loop
    awaitImageDecode={false}
    scrollTriggerIntoView={[
      { type: 'onOpenComplete', behavior: 'instant', block: 'nearest' },
      { type: 'onClose', behavior: 'instant', block: 'nearest' },
    ]}
  >
    <p class="kicker">Dispatch</p>
    <h3>The last fishermen of the northern coast</h3>
    <p class="byline">By Anna Beck · 8 min read</p>

    <p class="body first">
      The village wakes before the light does. For sixty years the boats went out whatever the weather; now, on most
      mornings, only three engines cough to life along the whole quay.
    </p>

    <div class="spaced">{@render figure(0)}</div>

    <p class="body spaced">
      Ask anyone here when it changed and they will not name a year. The harbor emptied the way harbors do — one
      retirement at a time, one son who moved to the city, one quota that made a small boat pointless.
    </p>

    <div class="pair spaced">
      {@render figure(1)}
      {@render figure(2)}
    </div>

    <CloseOnBack />
    <Lightbox.Gallery items={figures} ariaLabel="Article photographs" />
  </Lightbox.Root>
</article>

<style>
  .editorial-demo {
    width: 100%;
    max-width: 36rem;
    text-align: start;
  }
  p,
  h3,
  figure {
    margin: 0;
  }
  .kicker {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #a3a3a3;
  }
  h3 {
    margin-top: 0.5rem;
    font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
    font-size: 26px;
    font-weight: 400;
    line-height: 1.375;
    letter-spacing: -0.025em;
    color: #171717;
  }
  .byline {
    margin-top: 0.5rem;
    font-size: 13px;
    color: #737373;
  }
  .body {
    font-size: 15px;
    line-height: 1.75rem;
    color: #404040;
  }
  .first {
    margin-top: 1.25rem;
  }
  .spaced {
    margin-top: 1.5rem;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .editorial-demo :global(.editorial-demo-trigger) {
    display: block;
    width: 100%;
    overflow: hidden;
    border-radius: 0.5rem;
    scroll-margin-block: 1.25rem;
  }
  .morph {
    display: block;
    overflow: hidden;
    border-radius: 0.5rem;
  }
  .morph img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
  figcaption {
    margin-top: 0.5rem;
    font-size: 13px;
    line-height: 1.25rem;
    color: #737373;
  }
  .credit {
    color: #a3a3a3;
  }
  :global(:is(.dark, [data-theme='dark'])) h3 {
    color: #fafafa;
  }
  :global(:is(.dark, [data-theme='dark'])) .body {
    color: #d4d4d4;
  }
  :global(:is(.dark, [data-theme='dark'])) .credit {
    color: #525252;
  }
</style>
```
