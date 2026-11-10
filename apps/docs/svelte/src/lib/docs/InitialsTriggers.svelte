<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';

  let { people }: { people: { name: string; initials: string; color: string }[] } = $props();
</script>

<ul class="flex flex-wrap gap-6">
  {#each people as person, i (person.name)}
    <li class="flex w-20 flex-col items-center gap-2">
      <Lightbox.Trigger
        index={i}
        crossfade="both"
        class="size-16 overflow-hidden rounded-full bg-transparent p-0 {triggerFocus}"
      >
        <div
          class="flex size-full items-center justify-center text-sm font-semibold tracking-wide text-white"
          style:background={person.color}
        >
          {person.initials}
        </div>
      </Lightbox.Trigger>
      <span class="text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">{person.name}</span>
    </li>
  {/each}
</ul>
