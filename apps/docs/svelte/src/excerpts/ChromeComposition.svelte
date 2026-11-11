<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { items }: { items: { id: string; src: string; thumb: string; alt: string; caption: string }[] } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each items as item, i (item.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i} caption={item.caption}>
              <Lightbox.Zoom>
                <Lightbox.Media>
                  <img src={item.src} alt={item.alt} />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>

      <Lightbox.Counter />
      <Lightbox.ZoomOut aria-label="Zoom out" />
      <Lightbox.ZoomIn aria-label="Zoom in" />
      <Lightbox.Close aria-label="Close" />

      <Lightbox.Caption />
      <Lightbox.ThumbnailStrip>
        <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
          {#each items as item, i (item.id)}
            <Lightbox.Thumbnail index={i}>
              <img src={item.thumb} alt="" />
            </Lightbox.Thumbnail>
          {/each}
        </Lightbox.ThumbnailStripTrack>
        {#snippet indicator()}
          <span aria-hidden="true"></span>
        {/snippet}
      </Lightbox.ThumbnailStrip>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
