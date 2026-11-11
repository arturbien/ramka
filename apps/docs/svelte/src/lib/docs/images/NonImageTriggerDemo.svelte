<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';
  import DemoBadge from '../DemoBadge.svelte';
  import InitialsTriggers from '../InitialsTriggers.svelte';
  import SlowImage from '../SlowImage.svelte';

  const team = [
    {
      ...photo('sveltekit-image-do', 'Portrait of Ava Chen', 'Ava Chen'),
      name: 'Ava Chen',
      initials: 'AC',
      color: '#2a7ab5',
    },
    {
      ...photo('sveltekit-image-dont', 'Portrait of Jules Okonkwo', 'Jules Okonkwo'),
      name: 'Jules Okonkwo',
      initials: 'JO',
      color: '#c93c20',
    },
  ];
</script>

<div class="space-y-3">
  <DemoBadge tone="violet">Non-image trigger</DemoBadge>
  <Lightbox.Root>
    <InitialsTriggers people={team} />
    <LightboxGallery items={team} ariaLabel="Non-image trigger demo" zoomControls={false}>
      {#snippet item(entry)}
        <Lightbox.Zoom>
          <Lightbox.Media width={entry.width} height={entry.height} class="overflow-hidden rounded-none md:rounded-lg">
            <SlowImage item={entry} blur />
          </Lightbox.Media>
        </Lightbox.Zoom>
      {/snippet}
    </LightboxGallery>
  </Lightbox.Root>
</div>
