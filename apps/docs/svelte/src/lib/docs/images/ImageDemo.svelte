<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
  import { triggerFocus } from '#lib/gallery/chrome.js';
  import LightboxGallery from '#lib/gallery/LightboxGallery.svelte';
  import { photo } from '#lib/gallery/items.js';
  import DemoBadge from '../DemoBadge.svelte';
  import SlowImage from '../SlowImage.svelte';
  import { lqip } from './lqip.js';

  let { kind }: { kind: 'do' | 'dont' } = $props();
  const image = $derived(
    kind === 'do'
      ? photo('sveltekit-image-do', 'Do: placeholder on the trigger only')
      : photo('sveltekit-image-dont', 'Don’t: placeholder on the lightbox image'),
  );
</script>

<div class="space-y-3">
  <DemoBadge tone={kind}>{kind === 'do' ? 'Do' : 'Don’t'}</DemoBadge>
  <Lightbox.Root awaitImageDecode={false}>
    <Lightbox.Trigger
      index={0}
      class="block aspect-square w-40 overflow-hidden rounded-xl bg-transparent p-0 {triggerFocus}"
    >
      {#snippet children({ imageRef })}
        <img
          {@attach imageRef}
          src={image.thumb}
          alt={image.alt}
          class="size-full bg-cover object-cover"
          style={kind === 'do' ? lqip(image) : undefined}
        />
      {/snippet}
    </Lightbox.Trigger>
    <LightboxGallery items={[image]} ariaLabel={image.alt} thumbnails="never" zoomControls={false}>
      {#snippet item(entry)}
        <Lightbox.Zoom>
          <Lightbox.Media width={entry.width} height={entry.height} class="overflow-hidden rounded-none md:rounded-lg">
            <SlowImage item={entry} blur={kind === 'dont'} />
          </Lightbox.Media>
        </Lightbox.Zoom>
      {/snippet}
    </LightboxGallery>
  </Lightbox.Root>
</div>
