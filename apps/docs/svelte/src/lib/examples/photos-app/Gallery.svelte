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
