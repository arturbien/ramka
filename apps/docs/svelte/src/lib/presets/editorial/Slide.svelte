<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Slide> = $props();
</script>

<Lightbox.Slide class={['elb-slide', className]} {...rest} />
