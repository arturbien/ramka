<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { children } = $props();
</script>

<Lightbox.Root
  onOpenChange={(open) => console.log('sync URL or store', open)}
  onOpenChangeComplete={(open) => console.log('motion settled, clean up or move focus', open)}
  onValueChange={(index, { source }) => console.log(index, source)}
>
  {@render children()}
</Lightbox.Root>
