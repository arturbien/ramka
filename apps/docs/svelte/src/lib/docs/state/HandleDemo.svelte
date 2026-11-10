<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import TriggerGrid from '#lib/gallery/TriggerGrid.svelte';
  import { docsImages } from '#lib/gallery/docs-images.js';
  import { demoButton } from './button.js';

  const lightbox = Lightbox.createHandle();
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-neutral-600 dark:text-neutral-400">Product photos</p>
    <button type="button" onclick={() => lightbox.open(0, { triggerId: 'photo-0' })} class={demoButton}>
      View gallery
    </button>
  </div>
  <TriggerGrid items={docsImages} handle={lightbox} />
  <Lightbox.Root handle={lightbox}>
    <LightboxGallery items={docsImages} ariaLabel="Product photo gallery" />
  </Lightbox.Root>
</div>
