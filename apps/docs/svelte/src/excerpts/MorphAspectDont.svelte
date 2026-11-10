<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { photo, squareThumb }: { photo: { src: string; width: number; height: number }; squareThumb: string } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}>
    {#snippet children({ imageRef })}
      <!-- ✗ a 1∶1 file; Media below is the full 3∶2 photo -->
      <img {@attach imageRef} src={squareThumb} alt="Mountain lake" class="size-full object-cover" />
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
