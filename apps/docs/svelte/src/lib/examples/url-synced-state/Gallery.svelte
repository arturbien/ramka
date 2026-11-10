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
