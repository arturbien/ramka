<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo, extras }: { photo: string; extras: number } = $props();
</script>

<Lightbox.Root morphTo="closest">
  <Lightbox.Trigger index={0} crossfade="both">
    {#snippet children({ imageRef })}
      <div class="relative">
        <img {@attach imageRef} src={photo} alt="" />
        <span>+{extras}</span>
      </div>
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            {#snippet children({ imageRef })}
              <img {@attach imageRef} src={photo} alt="" />
            {/snippet}
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
