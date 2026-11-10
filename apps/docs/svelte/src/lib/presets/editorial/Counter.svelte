<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Counter> = $props();
</script>

<Lightbox.Counter class={['elb-counter', className]} {...rest} />
