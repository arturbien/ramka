<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Portal> = $props();
</script>

<Lightbox.Portal class={['elb-portal', className]} {...rest} />
