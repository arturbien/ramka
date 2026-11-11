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
