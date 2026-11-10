<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo }: { photo: { src: string; width: number; height: number } } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <img {@attach imageRef} src={photo.src} alt="Mountain lake" class="aspect-square size-full object-cover" />
    {/snippet}
  </Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media width={photo.width} height={photo.height}>
                <img src={photo.src} width={photo.width} height={photo.height} alt="Mountain lake" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
