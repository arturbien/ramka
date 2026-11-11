<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let open = $state(false);
  let index = $state(0);
</script>

<Lightbox.Root bind:open bind:index>
  <!-- triggers + content -->
</Lightbox.Root>
