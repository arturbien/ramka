<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Content> = $props();
</script>

<Lightbox.Content class={['elb-content', className]} {...rest} />
