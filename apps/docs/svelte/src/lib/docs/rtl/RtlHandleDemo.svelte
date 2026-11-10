<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import TriggerGrid from '#lib/gallery/TriggerGrid.svelte';
  import { docsImages } from '#lib/gallery/docs-images.js';
  import { demoButton } from '../state/button.js';

  const lightbox = Lightbox.createHandle();
  const last = docsImages.length - 1;
  const jumps = [
    { label: 'First (0)', index: 0 },
    { label: 'Index 3', index: 3 },
    { label: `Last (${last})`, index: last },
  ];
  let index = $state(0);
</script>

<div class="space-y-4" dir="rtl">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-sm text-neutral-600 dark:text-neutral-400">
      גלריית תמונות · active index {index}
    </p>
    <button type="button" onclick={() => lightbox.open(0)} class={demoButton}>פתיחת הגלריה</button>
  </div>
  <TriggerGrid items={docsImages} handle={lightbox} />
  <Lightbox.Root handle={lightbox} dir="rtl" bind:index>
    <LightboxGallery items={docsImages} ariaLabel="גלריית תמונות בגודל מלא">
      {#snippet overlay()}
        <div class="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center">
          <div class="pointer-events-auto flex gap-2" dir="ltr">
            {#each jumps as jump (jump.index)}
              <button
                type="button"
                onclick={() => lightbox.goTo(jump.index)}
                class="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75"
              >
                {jump.label}
              </button>
            {/each}
          </div>
        </div>
      {/snippet}
    </LightboxGallery>
  </Lightbox.Root>
</div>
