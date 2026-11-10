<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import type { ComponentProps } from 'svelte';

  let { class: className, ...rest }: ComponentProps<typeof Lightbox.Trigger> = $props();
</script>

<Lightbox.Trigger class={['stl-trigger', className]} {...rest} />
