<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Backdrop> = $props();
</script>

<Lightbox.Backdrop class={['elb-backdrop', className]} {...rest} />
