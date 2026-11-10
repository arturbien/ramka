<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import TriggerGrid from '#lib/gallery/TriggerGrid.svelte';
  import { docsImages } from '#lib/gallery/docs-images.js';

  let log = $state<{ id: number; time: string; callback: string; value: string }[]>([]);
  let next = 0;

  function push(callback: string, value: string) {
    const time = new Date().toLocaleTimeString(undefined, { hour12: false });
    log = [{ id: next++, time, callback, value }, ...log].slice(0, 12);
  }
</script>

<div class="space-y-4">
  <Lightbox.Root
    onOpenChange={(open) => push('onOpenChange', String(open))}
    onOpenChangeComplete={(open) => push('onOpenChangeComplete', String(open))}
    onValueChange={(index, { source }) => push('onValueChange', `index=${index} source=${source}`)}
  >
    <TriggerGrid items={docsImages} />
    <LightboxGallery items={docsImages} ariaLabel="Lifecycle-callbacks photo gallery" />
  </Lightbox.Root>
  <section
    class="w-full max-w-2xl rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <div class="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Event log</div>
    {#if log.length === 0}
      <p class="mt-2 text-sm text-neutral-500">Open or close the lightbox to see events.</p>
    {:else}
      <ul class="mt-2 space-y-1 font-mono text-xs text-neutral-700 dark:text-neutral-300">
        {#each log as entry (entry.id)}
          <li class="flex gap-3">
            <span class="text-neutral-400">{entry.time}</span>
            <span class="text-neutral-900 dark:text-neutral-100">{entry.callback}</span>
            <span class="text-neutral-500">→</span>
            <span>{entry.value}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
