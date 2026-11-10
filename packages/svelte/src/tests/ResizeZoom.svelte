<script lang="ts">
  import { Lightbox } from '#lib';

  let { report }: { report: (zoom: ReturnType<typeof Lightbox.Zoom>) => void } = $props();
  let zoom = $state<ReturnType<typeof Lightbox.Zoom>>();
  const image = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="3000"/>';
  $effect(() => {
    if (zoom) report(zoom);
  });
</script>

<Lightbox.Root open>
  <Lightbox.Portal>
    <Lightbox.Content aria-label="Viewer" style="position:fixed;inset:0">
      <Lightbox.Item index={0} aria-label="One" style="width:50vw;height:50vh">
        <Lightbox.Zoom bind:this={zoom}>
          <Lightbox.Media width={4000} height={3000}><img src={image} alt="One" /></Lightbox.Media>
        </Lightbox.Zoom>
      </Lightbox.Item>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
