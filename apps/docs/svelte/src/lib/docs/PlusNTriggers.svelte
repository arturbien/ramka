<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';
  import type { GalleryItem } from '#lib/gallery/items.js';
  import { lqip } from './images/lqip.js';

  let { items, visible, blur = false }: { items: GalleryItem[]; visible: number; blur?: boolean } = $props();
</script>

<div class="grid max-w-sm grid-cols-2 gap-0.5">
  {#each items.slice(0, visible) as item, i (item.src)}
    {@const overlay = i === visible - 1 && items.length > visible}
    <Lightbox.Trigger
      index={i}
      crossfade={overlay ? 'both' : undefined}
      class="block overflow-hidden bg-transparent p-0 {triggerFocus} {i === 0 ? 'rounded-l-xl' : 'rounded-r-xl'}"
    >
      {#snippet children({ imageRef })}
        <div class="relative overflow-hidden">
          <img
            {@attach imageRef}
            src={item.thumb}
            alt={item.alt}
            class="block aspect-square w-full bg-cover object-cover"
            style={blur ? lqip(item) : undefined}
          />
          {#if overlay}
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
              <span class="text-2xl font-bold text-white">+{items.length - visible}</span>
            </div>
          {/if}
        </div>
      {/snippet}
    </Lightbox.Trigger>
  {/each}
</div>
