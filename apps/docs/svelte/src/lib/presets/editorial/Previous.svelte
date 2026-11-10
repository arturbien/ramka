<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, children, ...rest }: ComponentProps<typeof Lightbox.Previous> = $props();
</script>

<Lightbox.Previous class={['elb-control', 'elb-nav', 'elb-nav-prev', className]} aria-label="Previous" {...rest}>
  {#if children}
    {@render children()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  {/if}
</Lightbox.Previous>
