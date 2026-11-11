<script lang="ts">
  import { Lightbox } from '#lib';
  import ContextProbe from './ContextProbe.svelte';
  import MediaProbe from './MediaProbe.svelte';

  let { report }: { report: (name: string, value: unknown) => void } = $props();
  let zoom = $state<ReturnType<typeof Lightbox.Zoom>>();
  const pixel = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"/>';
  $effect(() => report('zoom', zoom));
</script>

<ContextProbe {report} />
<Lightbox.Root open>
  <Lightbox.Portal>
    <Lightbox.Content aria-label="Viewer" style="position:fixed;inset:0">
      <Lightbox.Item index={0} aria-label="One" style="width:400px;height:300px">
        <Lightbox.Zoom bind:this={zoom} maxZoom={4}>
          <Lightbox.Media width={400} height={300}>
            <img src={pixel} alt="One" />
            <MediaProbe {report} />
          </Lightbox.Media>
        </Lightbox.Zoom>
      </Lightbox.Item>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
