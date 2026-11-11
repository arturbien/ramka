<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from './chrome.js';
  import type { GalleryItem } from './items.js';

  let { items, handle }: { items: GalleryItem[]; handle?: ReturnType<typeof Lightbox.createHandle> } = $props();
</script>

<div class="grid max-w-md grid-cols-3 gap-3">
  {#each items as item, i (item.src)}
    <Lightbox.Trigger
      index={i}
      {handle}
      id={handle ? `photo-${i}` : undefined}
      class="block overflow-hidden rounded-2xl {triggerFocus}"
    >
      <img
        src={item.thumb}
        alt={item.alt}
        width={item.width}
        height={item.height}
        class="block h-28 w-full rounded-2xl object-cover"
      />
    </Lightbox.Trigger>
  {/each}
</div>
