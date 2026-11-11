<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { getModel } from './state.svelte.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet;
  }

  let { children, ...rest }: Props = $props();
  const lb = getModel();
  const caption = $derived(lb.caption);
</script>

<div data-ramka-caption data-has-caption={!!caption || undefined} aria-live="polite" aria-atomic="true" {...rest}>
  {#if typeof caption === 'string'}
    {caption}
  {:else if caption}
    {@render caption()}
  {:else if lb.items.size === 0}
    {@render children?.()}
  {/if}
</div>
