<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';

  interface Props {
    morphTo: Lightbox.MorphTo;
    triggers?: number;
    crossfade?: 'all' | 'last';
    ariaLabel: string;
  }

  const items = [
    photo('morph1', 'Alpine meadow', 'Alpine meadow'),
    photo('morph2', 'Rocky coastline', 'Rocky coastline'),
    photo('morph3', 'Autumn vineyard', 'Autumn vineyard'),
    photo('morph4', 'Desert canyon', 'Desert canyon'),
    photo('morph5', 'Northern lake', 'Northern lake'),
  ];
  let { morphTo, triggers = items.length, crossfade, ariaLabel }: Props = $props();
</script>

<Lightbox.Root {morphTo} awaitImageDecode={false}>
  <div class="grid gap-2" style:grid-template-columns="repeat({triggers}, minmax(0, 1fr))">
    {#each items.slice(0, triggers) as item, i (item.src)}
      <Lightbox.Trigger
        index={i}
        crossfade={crossfade === 'all' || (crossfade === 'last' && i === triggers - 1) ? 'both' : undefined}
        class="block cursor-pointer rounded-lg border-none bg-transparent p-0 {triggerFocus}"
      >
        <img src={item.thumb} alt={item.alt} loading="lazy" class="block aspect-[3/2] w-full rounded-lg object-cover" />
      </Lightbox.Trigger>
    {/each}
  </div>
  <LightboxGallery {items} {ariaLabel} />
</Lightbox.Root>
