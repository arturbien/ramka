<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Close> = $props();
</script>

<Lightbox.Close class={['elb-control', className]} aria-label="Close" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Close>
