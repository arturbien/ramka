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
