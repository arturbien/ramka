<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { docsImages } from '#lib/gallery/docs-images.js';
  import { demoButton } from './button.js';

  let open = $state(false);
  let index = $state(0);
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center gap-3">
    <button type="button" onclick={() => (open = true)} class={demoButton}>Open lightbox</button>
    <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
      Active index
      <input
        type="number"
        min="0"
        max={docsImages.length - 1}
        bind:value={() => index, (v) => (index = Math.max(0, Math.min(docsImages.length - 1, Number(v) || 0)))}
        class="w-16 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
    </label>
    <span class="text-xs text-neutral-500">open = {open}</span>
  </div>
  <Lightbox.Root bind:open bind:index>
    <LightboxGallery items={docsImages} ariaLabel="Controlled photo gallery" />
  </Lightbox.Root>
</div>
