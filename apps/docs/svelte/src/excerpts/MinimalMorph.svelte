<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { thumb, src }: { thumb: string; src: string } = $props();
</script>

<Lightbox.Root morphTo="active">
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <img {@attach imageRef} src={thumb} alt="" />
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media>
                <img {src} alt="" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
