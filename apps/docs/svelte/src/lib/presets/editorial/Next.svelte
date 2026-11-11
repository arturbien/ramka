<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Next> = $props();
</script>

<Lightbox.Next class={['elb-control', 'elb-nav', 'elb-nav-next', className]} aria-label="Next" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Next>
