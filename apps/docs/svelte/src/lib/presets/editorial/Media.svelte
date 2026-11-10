<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Media> = $props();
</script>

<Lightbox.Media class={['elb-media', className]} {...rest} />
