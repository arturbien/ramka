<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Lightbox } from '@ramka/svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['slb-trigger', className]} {...rest} />
