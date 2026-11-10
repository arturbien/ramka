<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Caption> = $props();
</script>

<Lightbox.Caption class={['elb-caption', className]} {...rest} />
