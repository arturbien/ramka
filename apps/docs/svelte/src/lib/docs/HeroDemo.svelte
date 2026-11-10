<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';

  const items = [
    photo('docs-hero-a', 'Mountain ridge'),
    photo('docs-hero-b', 'Coastal path'),
    photo('docs-hero-c', 'Forest light'),
  ];
</script>

<Lightbox.Root>
  <div class="grid max-w-md grid-cols-3 gap-2">
    {#each items as item, i (item.src)}
      <Lightbox.Trigger
        index={i}
        class="block aspect-square overflow-hidden rounded-lg bg-transparent p-0 {triggerFocus}"
      >
        <img
          src={item.thumb}
          alt={item.alt}
          width={item.width}
          height={item.height}
          class="block size-full object-cover"
        />
      </Lightbox.Trigger>
    {/each}
  </div>
  <LightboxGallery {items} ariaLabel="Lightbox hero demo" />
</Lightbox.Root>
