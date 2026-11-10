<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Item> = $props();
</script>

<Lightbox.Item class={['elb-item', className]} {...rest} />
