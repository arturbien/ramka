<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { browser } from '$app/env';
  import GalleryHorizontal from '@lucide/svelte/icons/gallery-horizontal';
  import RectangleHorizontal from '@lucide/svelte/icons/rectangle-horizontal';
  import X from '@lucide/svelte/icons/x';
  import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
  import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
  import type { Snippet } from 'svelte';
  import {
    chromeButton,
    chromeButtonGroup,
    chromeButtonMd,
    chromeButtonSegment,
    chromeSegmentDivider,
  } from './chrome.js';
  import CloseOnBack from './CloseOnBack.svelte';
  import { ratio, type GalleryItem } from './items.js';

  interface Props {
    items: GalleryItem[];
    ariaLabel: string;
    preload?: number;
    maxZoom?: number;
    thumbnails?: 'desktop' | 'always' | 'never';
    zoomControls?: boolean;
    pullToClose?: boolean;
    backdrop?: 'scrim' | 'solid';
    slidesLayout?: 'bleed' | 'snug';
    layoutToggle?: boolean;
    item?: Snippet<[GalleryItem, number]>;
    overlay?: Snippet;
  }

  let {
    items,
    ariaLabel,
    preload = 3,
    maxZoom = 6,
    thumbnails = 'desktop',
    zoomControls = true,
    pullToClose = true,
    backdrop = 'scrim',
    slidesLayout = 'bleed',
    layoutToggle = false,
    item,
    overlay,
  }: Props = $props();

  const storageKey = 'ramka-docs-slides-layout';
  let chosen = $state(browser ? storedLayout() : null);

  function storedLayout() {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === 'bleed' || stored === 'snug' ? stored : null;
    } catch {
      return null;
    }
  }

  const layout = $derived(layoutToggle ? (chosen ?? slidesLayout) : slidesLayout);
  const snug = $derived(layout === 'snug');
  const showStrip = $derived(thumbnails !== 'never' && items.length > 1);

  function toggleLayout() {
    const flip = () => {
      chosen = snug ? 'bleed' : 'snug';
      try {
        localStorage.setItem(storageKey, chosen);
      } catch {}
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) return flip();
    document.startViewTransition(flip);
  }
</script>

<CloseOnBack />
<Lightbox.Portal>
  <Lightbox.Backdrop
    class={[
      'lightbox-demo-backdrop fixed inset-0',
      backdrop === 'solid' ? 'bg-white dark:bg-black' : 'lightbox-demo-backdrop-light',
    ]}
  />
  <Lightbox.Content
    aria-label={ariaLabel}
    {pullToClose}
    class={[
      'lightbox-demo-content fixed inset-0 flex flex-col overscroll-contain outline-none',
      snug && 'lightbox-demo-content-snug',
      !showStrip && 'lightbox-demo-content-solo',
    ]}
  >
    {#key layout}
      <Lightbox.Slides
        aria-label="Full-size images"
        aria-roledescription="carousel"
        {preload}
        class={snug
          ? 'lightbox-demo-slides lightbox-demo-slides-snug flex-1 [&::-webkit-scrollbar]:hidden'
          : 'lightbox-demo-slides flex-1 gap-5 md:gap-0 [&::-webkit-scrollbar]:hidden'}
        style={snug && items.length
          ? `--lightbox-snug-ratio-start: ${ratio(items[0])}; --lightbox-snug-ratio-end: ${ratio(items[items.length - 1])}`
          : undefined}
      >
        {#each items as entry, i (entry.src)}
          <Lightbox.Slide
            class={snug
              ? 'lightbox-demo-slide-snug lightbox-demo-slide-pad z-0 h-full'
              : 'lightbox-demo-slide-pad h-full'}
            style={snug ? `--lightbox-snug-ratio: ${ratio(entry)}` : undefined}
          >
            <Lightbox.Item index={i} caption={entry.caption ?? entry.alt} aria-label="{i + 1} of {items.length}">
              {#if item}
                {@render item(entry, i)}
              {:else}
                <Lightbox.Zoom {maxZoom}>
                  <Lightbox.Media
                    width={entry.width}
                    height={entry.height}
                    class="overflow-hidden rounded-none after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[inherit] md:rounded-lg md:after:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.1)] md:dark:after:shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.12)]"
                  >
                    <img
                      src={entry.src}
                      alt={entry.alt}
                      width={entry.width}
                      height={entry.height}
                      loading="eager"
                      draggable="false"
                      class="select-none"
                    />
                  </Lightbox.Media>
                </Lightbox.Zoom>
              {/if}
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
    {/key}

    {@render overlay?.()}

    <div
      class="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex gap-2"
    >
      {#if layoutToggle}
        <button
          type="button"
          class="{chromeButtonMd} lightbox-demo-chrome-hide lightbox-demo-zoom-hide"
          aria-pressed={snug}
          aria-label={snug ? 'Switch to theater layout' : 'Switch to peek layout'}
          title={snug ? 'Theater' : 'Peek'}
          onclick={toggleLayout}
        >
          {#if snug}
            <GalleryHorizontal aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
          {:else}
            <RectangleHorizontal aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
          {/if}
        </button>
      {/if}
      {#if zoomControls}
        <div class={chromeButtonGroup}>
          <Lightbox.ZoomOut class={chromeButtonSegment} aria-label="Zoom out" title="Zoom out">
            <ZoomOutIcon aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
          </Lightbox.ZoomOut>
          <Lightbox.ZoomIn class="{chromeButtonSegment} {chromeSegmentDivider}" aria-label="Zoom in" title="Zoom in">
            <ZoomInIcon aria-hidden="true" class="h-4 w-4" strokeWidth={2.25} />
          </Lightbox.ZoomIn>
        </div>
      {/if}
      <Lightbox.Close class={chromeButton} aria-label="Close" title="Close">
        <X aria-hidden="true" class="h-[18px] w-[18px]" strokeWidth={2.25} />
      </Lightbox.Close>
    </div>

    <div
      class={[
        'lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]',
        !showStrip && 'lightbox-demo-chrome-bottom-solo',
      ]}
    >
      <div class="flex max-w-full flex-col items-center text-center">
        <Lightbox.Caption
          class="block max-w-full truncate text-[13px] leading-tight font-medium text-neutral-900 dark:text-neutral-50"
        />
        {#if items.length > 1}
          <Lightbox.Counter
            class="text-[11px] leading-tight text-neutral-500 tabular-nums md:sr-only dark:text-neutral-400"
          >
            {#snippet children({ current, total })}{current} of {total}{/snippet}
          </Lightbox.Counter>
        {/if}
      </div>
      {#if showStrip}
        <Lightbox.ThumbnailStrip
          class={['lightbox-demo-thumbnail-strip pointer-events-auto', thumbnails === 'desktop' && 'hidden md:block']}
        >
          <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
            {#each items as entry, i (entry.src)}
              <Lightbox.Thumbnail index={i}>
                <img src={entry.thumb} alt={entry.alt} draggable="false" />
              </Lightbox.Thumbnail>
            {/each}
          </Lightbox.ThumbnailStripTrack>
          {#snippet indicator()}
            <span class="lightbox-demo-thumbnail-strip-indicator" aria-hidden="true"></span>
          {/snippet}
        </Lightbox.ThumbnailStrip>
      {/if}
    </div>
  </Lightbox.Content>
</Lightbox.Portal>
