<script lang="ts">
  import { Lightbox } from '#lib';

  let { first = true }: { first?: boolean } = $props();
</script>

{#if first}
  <Lightbox.Root open>
    <Lightbox.Portal>
      <Lightbox.Content aria-label="First"></Lightbox.Content>
    </Lightbox.Portal>
  </Lightbox.Root>
{/if}
<Lightbox.Root>
  <Lightbox.Portal keepMounted>
    <Lightbox.Content aria-label="Second">
      <Lightbox.Zoom data-testid="second-zoom"></Lightbox.Zoom>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
