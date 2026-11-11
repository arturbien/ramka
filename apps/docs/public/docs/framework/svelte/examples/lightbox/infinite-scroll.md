# Infinite scroll

An endless feed where the lightbox paginates too — one photo array drives grid tiles and slides; the grid loads pages via an IntersectionObserver sentinel, and onValueChange fetches ahead inside the open viewer, appending slides to the native scroll-snap track with a minimal Previous/Next chrome (no thumbnails).

## Source

```tsx docs/framework/svelte/examples/lightbox/infinite-scroll/page.tsx
import type { Metadata } from 'next';

import { SvelteDemo } from '../../../../../../../_components/svelte-demo';

export const metadata: Metadata = {
  title: 'Infinite scroll example · Svelte',
  description:
    'An endless photo feed whose lightbox paginates too: swiping near the end fetches the next page and appends slides to the native scroll-snap track while the viewer stays open, built with ramka.',
};

export default function SvelteInfiniteScrollPage() {
  return <SvelteDemo id="examples/infinite-scroll/InfiniteScroll" />;
}
```

```svelte svelte/src/lib/examples/infinite-scroll/InfiniteScroll.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import X from '@lucide/svelte/icons/x';
  import ZoomIn from '@lucide/svelte/icons/zoom-in';
  import ZoomOut from '@lucide/svelte/icons/zoom-out';
  import { photoAssets } from '../photos-app/photos.js';
  import '../photos-app/chrome.css';
  import '../photos-app/photos-app.css';
  import './infinite-scroll.css';
  import CloseOnBack from '#lib/gallery/CloseOnBack.svelte';

  const PAGE_SIZE = 12;
  const LOAD_AHEAD = 4;
  const FETCH_DELAY_MS = 800;

  function buildPage(page: number) {
    return Array.from({ length: PAGE_SIZE }, (_, i) => {
      const serial = page * PAGE_SIZE + i;
      return {
        ...photoAssets[serial % photoAssets.length],
        id: `feed-${serial}`,
        alt: `Feed photo ${serial + 1}`,
        caption: `Photo #${serial + 1}`,
      };
    });
  }

  function fetchPhotosPage(page: number): Promise<ReturnType<typeof buildPage>> {
    return new Promise((resolve) => setTimeout(() => resolve(buildPage(page)), FETCH_DELAY_MS));
  }

  let photos = $state(buildPage(0));
  let loading = $state(false);
  let nextPage = 1;

  function loadMore() {
    if (loading) return;
    loading = true;
    const page = nextPage;
    fetchPhotosPage(page).then((more) => {
      nextPage = page + 1;
      loading = false;
      photos.push(...more);
    });
  }

  function sentinel(node: HTMLElement) {
    void photos.length;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }
</script>

<div class="photos-app">
  <Lightbox.Root
    onValueChange={(value) => {
      if (value >= photos.length - LOAD_AHEAD) loadMore();
    }}
    scrollTriggerIntoView={[
      { type: 'onChange', behavior: 'instant' },
      { type: 'onOpenComplete', behavior: 'instant' },
    ]}
    awaitImageDecode={false}
  >
    <CloseOnBack />
    <div class="infinite-scroll-toolbar">
      <div class="photos-app-heading">
        <span class="photos-app-title">Feed</span>
        <span class="photos-app-subtitle">{photos.length} photos loaded · scrolls forever</span>
      </div>
    </div>

    <div class="infinite-scroll-grid">
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
          {/snippet}
        </Lightbox.Trigger>
      {/each}
    </div>

    <div class="infinite-scroll-sentinel" aria-hidden="true" {@attach sentinel}>
      <LoaderCircle class={['infinite-scroll-spinner', loading && 'infinite-scroll-visible']} size={20} />
    </div>

    <Lightbox.Portal class="photos-app-lb-portal">
      <Lightbox.Backdrop class="photos-app-lb-backdrop photos-app-lb-backdrop-solid" />
      <Lightbox.Content aria-label="Feed photos" class="photos-app-lb-content photos-app-lb-content-solo">
        <Lightbox.Slides
          aria-roledescription="carousel"
          aria-label="Full-size photos"
          preload={2}
          class="photos-app-lb-slides"
        >
          {#each photos as photo, i (photo.id)}
            <Lightbox.Slide class="photos-app-lb-slide">
              <Lightbox.Item index={i} aria-roledescription="slide" aria-label="{i + 1} of {photos.length}">
                <Lightbox.Zoom maxZoom={6}>
                  <Lightbox.Media width={photo.width} height={photo.height} class="photos-app-lb-media">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      loading="eager"
                      draggable="false"
                    />
                  </Lightbox.Media>
                </Lightbox.Zoom>
              </Lightbox.Item>
            </Lightbox.Slide>
          {/each}
        </Lightbox.Slides>

        <div class="infinite-scroll-nav infinite-scroll-nav-start photos-app-lb-chrome-hide">
          <Lightbox.Previous class="photos-app-lb-button photos-app-lb-md" aria-label="Previous photo">
            <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.25} />
          </Lightbox.Previous>
        </div>
        <div class="infinite-scroll-nav infinite-scroll-nav-end photos-app-lb-chrome-hide">
          <Lightbox.Next class="photos-app-lb-button photos-app-lb-md" aria-label="Next photo">
            <ChevronRight aria-hidden="true" size={20} strokeWidth={2.25} />
          </Lightbox.Next>
        </div>

        <div class="photos-app-lb-top photos-app-lb-chrome-hide">
          <div class="photos-app-lb-group photos-app-lb-md">
            <Lightbox.ZoomOut class="photos-app-lb-segment" aria-label="Zoom out">
              <ZoomOut aria-hidden="true" size={16} strokeWidth={2.25} />
            </Lightbox.ZoomOut>
            <Lightbox.ZoomIn class="photos-app-lb-segment" aria-label="Zoom in">
              <ZoomIn aria-hidden="true" size={16} strokeWidth={2.25} />
            </Lightbox.ZoomIn>
          </div>
          <Lightbox.Close class="photos-app-lb-button" aria-label="Close">
            <X aria-hidden="true" size={18} strokeWidth={2.25} />
          </Lightbox.Close>
        </div>

        <div class="photos-app-lb-bottom infinite-scroll-bottom photos-app-lb-chrome-hide">
          <Lightbox.Counter class="photos-app-lb-counter">
            {#snippet children({ current, total })}{current} of {total}{/snippet}
          </Lightbox.Counter>
          <div class={['infinite-scroll-pill', loading && 'infinite-scroll-visible']} aria-hidden={!loading}>
            <LoaderCircle class="infinite-scroll-pill-spinner" size={12} />
            Loading more photos
          </div>
        </div>
      </Lightbox.Content>
    </Lightbox.Portal>
  </Lightbox.Root>
</div>
```

```css svelte/src/lib/examples/infinite-scroll/infinite-scroll.css
.infinite-scroll-toolbar {
  position: sticky;
  top: 3.5rem;
  z-index: 30;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(0 0 0 / 0.06);
  background-color: var(--background, #fff);
  padding: 0.625rem 1rem;
}

:is(.dark, [data-theme='dark']) .infinite-scroll-toolbar {
  border-bottom-color: rgb(255 255 255 / 0.08);
}

.infinite-scroll-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.125rem;
}

@media (min-width: 768px) {
  .infinite-scroll-toolbar {
    top: 0;
  }

  .infinite-scroll-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .infinite-scroll-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.infinite-scroll-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-block: 2.5rem;
}

.infinite-scroll-spinner {
  color: #a3a3a3;
}

.infinite-scroll-spinner,
.infinite-scroll-pill-spinner {
  animation: infinite-scroll-spin 1s linear infinite;
}

.infinite-scroll-spinner,
.infinite-scroll-pill {
  opacity: 0;
  transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.infinite-scroll-visible {
  opacity: 1;
}

@keyframes infinite-scroll-spin {
  to {
    transform: rotate(360deg);
  }
}

.infinite-scroll-nav {
  position: absolute;
  top: 50%;
  z-index: 30;
  transform: translateY(-50%);
}

.infinite-scroll-nav-start {
  inset-inline-start: 0.75rem;
}

.infinite-scroll-nav-end {
  inset-inline-end: 0.75rem;
}

.infinite-scroll-bottom {
  gap: 0.5rem;
}

.infinite-scroll-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: rgb(0 0 0 / 0.05);
  padding: 0.25rem 0.625rem;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
  color: #525252;
}

:is(.dark, [data-theme='dark']) .infinite-scroll-pill {
  background-color: rgb(255 255 255 / 0.09);
  color: #d4d4d4;
}
```
