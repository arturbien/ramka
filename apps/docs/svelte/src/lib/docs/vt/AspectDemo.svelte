<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';
  import DemoBadge from '../DemoBadge.svelte';
  import SlowImage from '../SlowImage.svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';

  let { kind }: { kind: 'do' | 'dont' } = $props();
  const full = photo('xfade-a', 'Coastal cliffs');
  const alt = $derived(kind === 'do' ? 'Do: same source aspect' : 'Don’t: baked square crop');
  const thumb = $derived(kind === 'do' ? full.thumb : '/svelte/photos/xfade-a-square-thumb.jpg');
</script>

<div class="space-y-3">
  <DemoBadge tone={kind}>{kind === 'do' ? 'Do' : 'Don’t'}</DemoBadge>
  <Lightbox.Root awaitImageDecode={false}>
    <Lightbox.Trigger index={0} class="block aspect-square w-40 overflow-hidden rounded-xl {triggerFocus}">
      {#snippet children({ imageRef })}
        <img {@attach imageRef} src={thumb} {alt} class="size-full object-cover" />
      {/snippet}
    </Lightbox.Trigger>
    <LightboxGallery items={[{ ...full, thumb, alt }]} ariaLabel={alt} thumbnails="never" zoomControls={false}>
      {#snippet item(entry)}
        <Lightbox.Zoom>
          <Lightbox.Media width={entry.width} height={entry.height} class="overflow-hidden rounded-none md:rounded-lg">
            <SlowImage item={entry} />
          </Lightbox.Media>
        </Lightbox.Zoom>
      {/snippet}
    </LightboxGallery>
  </Lightbox.Root>
</div>
