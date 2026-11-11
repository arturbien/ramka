<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getModel } from './state.svelte.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    children?: Snippet<[{ current: number; total: number }]>;
  }

  let { children, ...rest }: Props = $props();
  const lb = getModel();
</script>

<div data-ramka-counter aria-live="polite" aria-atomic="true" {...rest}>
  {#if children}
    {@render children({ current: lb.index + 1, total: lb.count })}
  {:else}
    {lb.index + 1} / {lb.count}
  {/if}
</div>
