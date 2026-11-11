<script lang="ts">
  import { Lightbox } from '@ramka/svelte';
</script>

<Lightbox.Root>
  <Lightbox.Trigger index={0}><img src="/thumb.jpg" alt="" /></Lightbox.Trigger>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media>
                <img src="/photo.jpg" alt="" />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
      <Lightbox.Counter />
      <Lightbox.ZoomOut aria-label="Zoom out" />
      <Lightbox.ZoomIn aria-label="Zoom in" />
      <Lightbox.Close aria-label="Close" />
      <Lightbox.Caption />
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
