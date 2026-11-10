<script lang="ts">
  import type { Snippet } from 'svelte';

  const tones = {
    do: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    dont: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
    sky: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
    violet: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  };

  let { tone, children }: { tone: keyof typeof tones; children: Snippet } = $props();
</script>

<div
  class={['inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase', tones[tone]]}
>
  {@render children()}
</div>
