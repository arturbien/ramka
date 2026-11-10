<script lang="ts">
  import { Separator } from '#lib/components/ui/separator/index.js';
  import MorphToDemo from './MorphToDemo.svelte';

  const heading = 'text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50';
  const text = 'text-sm text-neutral-600 dark:text-neutral-400';
</script>

<div class="flex flex-col gap-10">
  <section class="space-y-3">
    <h4 class={heading}>morphTo="active"</h4>
    <p class={text}>Default. Close morphs to the trigger matching the active index. All five images have triggers.</p>
    <MorphToDemo morphTo="active" ariaLabel={'morphTo="active" demo'} />
  </section>
  <Separator />
  <section class="space-y-3">
    <h4 class={heading}>morphTo="origin"</h4>
    <p class={text}>Always morph back to the trigger that opened the lightbox (one tile, many items).</p>
    <MorphToDemo morphTo="origin" triggers={1} crossfade="all" ariaLabel={'morphTo="origin" demo'} />
  </section>
  <Separator />
  <section class="space-y-3">
    <h4 class={heading}>morphTo="closest"</h4>
    <p class={text}>
      Active trigger if registered, otherwise the nearest one. Useful for +N grids (only the first 3 have triggers
      below).
    </p>
    <MorphToDemo morphTo="closest" triggers={3} crossfade="last" ariaLabel={'morphTo="closest" demo'} />
  </section>
</div>
