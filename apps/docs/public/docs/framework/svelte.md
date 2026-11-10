# ramka

Unstyled, accessible lightbox primitives for Svelte 5, in the style of Bits UI. Compose your own lightbox UI on headless parts with view-transition morph by default, swipe slides, zoom, and pull-to-dismiss.

## Installation

```bash
pnpm add @ramka/svelte
```

Peer dependency: `svelte` >= 5.40. Works in SvelteKit and plain Vite apps.

## Quick start

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { items }: { items: { id: string; src: string; thumb: string; alt: string; caption?: string }[] } = $props();
</script>

<Lightbox.Root>
  {#each items as item, i (item.id)}
    <Lightbox.Trigger index={i}>
      <img src={item.thumb} alt={item.alt} />
    </Lightbox.Trigger>
  {/each}

  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content aria-label="Photo viewer">
      <Lightbox.Slides aria-label="Photos" aria-roledescription="carousel">
        {#each items as item, i (item.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i} caption={item.caption ?? item.alt} aria-label="{i + 1} of {items.length}">
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
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

The trigger is a plain `<button>`; its first `img` is the morph source. Every string in the viewer is yours: the library ships none, so nothing it renders is ever in the wrong language.

## Licensing

ramka is free software under the [MIT License](https://ramka.dev/license) , for open-source and proprietary use.

## Coming from React?

This is the Svelte 5 port of [ramka](docs.md) by [Artur Bień](https://github.com/arturbien) . The parts and their names match [@ramka/react](docs/lightbox/api.md) one to one. What changes:

- No `render` prop. Render props become snippets, and refs such as `imageRef` and `morphRef` become attachments ( `&#123;@attach imageRef&#125;`).
- `bind:open` and `bind:index` replace `open` /`defaultOpen` and `value` /`defaultValue`.
- Counter’s snippet gets `&#123; current, total &#125;`. The caption type is exported as `CaptionContent`.
- Zoom takes `minZoom`, `maxZoom`, `zoomStep`, `scrollToZoom`, `wheelSensitivity`, `keyboardPanDistance`, `doubleClickDelay` and `onZoomChange`; `bind:this` exposes `zoomIn`, `zoomOut`, `zoomTo` and `reset`.
- ThumbnailStrip needs a ThumbnailStripTrack child around the thumbnails.
- React hooks become context getters: `getLightbox`, `getTrigger`, `getItem`, `getStage`.
- The morph and pull engines ship in one bundle instead of loading lazily.

## Next steps

- [Lightbox overview](docs/framework/svelte/lightbox.md) : guidelines and anatomy, then [Composition](docs/framework/svelte/lightbox/composition.md).
- [Examples](docs/framework/svelte/examples/lightbox/photos-app.md) : live product demos and API pattern pages.
