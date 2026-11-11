<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { images }: { images: { id: string; src: string; alt: string }[] } = $props();
</script>

<Lightbox.Root dir="rtl">
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content aria-label="גלריית תמונות">
      <Lightbox.Slides>
        {#each images as img, i (img.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Media>
                <img src={img.src} alt={img.alt} />
              </Lightbox.Media>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
      <Lightbox.Close aria-label="סגירה" />
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
