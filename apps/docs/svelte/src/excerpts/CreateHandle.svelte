<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { images }: { images: { id: string; src: string; alt: string }[] } = $props();
  const lightbox = Lightbox.createHandle();
</script>

<button type="button" onclick={() => lightbox.open(0, { triggerId: 'photo-0' })}>View gallery</button>

{#each images as img, i (img.id)}
  <Lightbox.Trigger handle={lightbox} id="photo-{i}" index={i}>
    <img src={img.src} alt={img.alt} />
  </Lightbox.Trigger>
{/each}

<Lightbox.Root handle={lightbox}>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each images as img, i (img.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Zoom>
                <Lightbox.Media>
                  <img src={img.src} alt={img.alt} />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
      <Lightbox.Close aria-label="Close" />
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
