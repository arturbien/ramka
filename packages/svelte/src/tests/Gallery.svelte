<script lang="ts">
  import { Lightbox } from '#lib';

  let {
    dir,
    viewTransition = false,
    onBeforeOpen,
    onOpenChange,
    photos = ['Eins', 'Zwei', 'Drei'],
  }: {
    dir?: 'ltr' | 'rtl';
    viewTransition?: boolean;
    onBeforeOpen?: (ctx: Lightbox.BeforeOpenContext) => void | Promise<void>;
    onOpenChange?: (open: boolean) => void;
    photos?: string[];
  } = $props();
  const pixel = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"/>';
</script>

<Lightbox.Root {dir} {viewTransition} {onBeforeOpen} {onOpenChange}>
  {#each photos as name, i (name)}
    <Lightbox.Trigger index={i} aria-label="Open {name}">
      <img src={pixel} alt="" width="40" height="30" />
    </Lightbox.Trigger>
  {/each}
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content aria-label="Viewer" style="position:fixed;inset:0">
      <Lightbox.Slides aria-roledescription="carousel" style="display:flex;width:400px;height:300px">
        {#each photos as name, i (name)}
          <Lightbox.Slide style="flex:0 0 100%">
            <Lightbox.Item index={i} caption={name} aria-label={name}>
              <Lightbox.Zoom maxZoom={4}>
                <Lightbox.Media width={400} height={300}><img src={pixel} alt={name} /></Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
      <Lightbox.Close>Close</Lightbox.Close>
      <Lightbox.Previous>Previous</Lightbox.Previous>
      <Lightbox.Next>Next</Lightbox.Next>
      <Lightbox.ZoomIn>Zoom in</Lightbox.ZoomIn>
      <Lightbox.ZoomOut>Zoom out</Lightbox.ZoomOut>
      <Lightbox.Counter />
      <Lightbox.Caption />
      <Lightbox.ThumbnailGroup aria-label="Thumbnails">
        {#each photos as name, i (name)}
          <Lightbox.Thumbnail index={i}>{name}</Lightbox.Thumbnail>
        {/each}
      </Lightbox.ThumbnailGroup>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
