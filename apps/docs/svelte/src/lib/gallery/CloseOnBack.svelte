<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  const lb = Lightbox.getLightbox();
  let owned = false;

  $effect(() => {
    const open = lb.open;
    untrack(() => {
      if (open && !owned) {
        owned = true;
        if (!page.state.lightbox) goto('', { shallow: true, state: { lightbox: true } });
      } else if (!open && owned) {
        owned = false;
        if (page.state.lightbox) history.back();
      }
    });
  });

  $effect(() => {
    if (page.state.lightbox || !owned) return;
    owned = false;
    untrack(() => lb.close());
  });
</script>
