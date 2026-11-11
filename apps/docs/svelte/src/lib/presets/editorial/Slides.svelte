<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Slides> = $props();
</script>

<Lightbox.Slides class={['elb-slides', className]} {...rest} />
