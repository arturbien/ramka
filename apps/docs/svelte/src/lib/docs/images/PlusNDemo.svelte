<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';
  import DemoBadge from '../DemoBadge.svelte';
  import PlusNTriggers from '../PlusNTriggers.svelte';
  import SlowImage from '../SlowImage.svelte';

  const album = [
    photo('sveltekit-image-do', 'Mountain ridge'),
    photo('sveltekit-image-dont', 'Sunlit valley'),
    photo('sveltekit-image-c', 'Green hills'),
    photo('sveltekit-image-d', 'Forest path'),
  ];
  const visible = 2;
</script>

<div class="space-y-3">
  <DemoBadge tone="sky">+N extras</DemoBadge>
  <Lightbox.Root morphTo="closest" awaitImageDecode={false}>
    <PlusNTriggers items={album} {visible} blur />
    <LightboxGallery items={album} ariaLabel="Plus N image demo" zoomControls={false}>
      {#snippet item(entry, i)}
        <Lightbox.Zoom>
          <Lightbox.Media width={entry.width} height={entry.height} class="overflow-hidden rounded-none md:rounded-lg">
            <SlowImage item={entry} blur={i >= visible} />
          </Lightbox.Media>
        </Lightbox.Zoom>
      {/snippet}
    </LightboxGallery>
  </Lightbox.Root>
</div>
