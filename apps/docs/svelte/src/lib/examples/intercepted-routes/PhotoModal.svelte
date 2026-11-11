<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import Gallery from '#lib/examples/url-synced-state/Gallery.svelte';
  import { interceptedPhotos, photoHref } from './photos.js';

  interface Props {
    initialIndex: number;
  }

  let { initialIndex }: Props = $props();
  let open = $state(true);
  let index = $state(untrack(() => initialIndex));

  function onValueChange(next: number) {
    const photo = interceptedPhotos[next];
    goto(photoHref(photo), { shallow: true, replace: true, state: { photo: photo.id } });
  }

  function onOpenChangeComplete(isOpen: boolean) {
    if (!isOpen) history.back();
  }
</script>

<Lightbox.Root bind:open bind:index {onValueChange} {onOpenChangeComplete} count={interceptedPhotos.length} loop>
  <Gallery items={interceptedPhotos} ariaLabel="Gallery photos" captionFallback={interceptedPhotos[index].caption} />
</Lightbox.Root>
