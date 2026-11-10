<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { src, alt, width, height }: { src: string; alt: string; width: number; height: number } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content class="fixed inset-0 flex flex-col">
      <Lightbox.Slides class="flex-1">
        <Lightbox.Slide class="h-full p-8">
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media {width} {height}>
                <img {width} {height} {src} {alt} />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
