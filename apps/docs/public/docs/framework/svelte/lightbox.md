# Lightbox

Accessible primitives for fullscreen media lightboxes: compound Svelte components in the style of Bits UI. Cosmetically unstyled: you own colors, chrome, and radius values. ramka owns state, focus, gestures, morphs, and the structural styles those mechanics need.

## Usage guidelines

Work through these decisions in order:

1. **State**: uncontrolled, or `bind:open` and `bind:index`? See [State & lifecycle](docs/framework/svelte/lightbox/state-lifecycle.md).
2. **Layout**: default to the swipe carousel ( [Slides + Zoom](docs/framework/svelte/lightbox/composition.md#slides)). See [Composition](docs/framework/svelte/lightbox/composition.md).
3. **Morph**: on by default. Wrap destination media in `Lightbox.Media`, put an `img` inside each Trigger, choose `crossfade` and `morphTo`, or pass `viewTransition=&#123;false&#125;` to opt out. See [View transitions](docs/framework/svelte/lightbox/view-transitions.md).
4. **Gestures**: pull-to-dismiss on Content, Zoom on media, keyboard on Content. See [Gestures](docs/framework/svelte/lightbox/gestures.md).
5. **Cosmetics vs mechanics**: colors, chrome, and radius *values* are yours. Structural styles (view-transition morph CSS, morph host box, zoom overflow, slide snap alignment) are applied by the library or through Media `width` /`height`. Slide track width (full-bleed or snug cards) is your CSS, see [Composition: Slides + Zoom](docs/framework/svelte/lightbox/composition.md#slides). Style with the documented `data-*` attributes and CSS variables from the [API reference](docs/framework/svelte/lightbox/api.md).

## Anatomy

Import the namespace and compose parts. The sketch below is the default gallery shape (Slides + Zoom + chrome). Every part is optional except Root, which holds the state.

```svelte Gallery.svelte
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
```

## Next steps

- [State & lifecycle](docs/framework/svelte/lightbox/state-lifecycle.md): bind:open, bind:index, show() and close(), open-change callbacks.
- [Composition](docs/framework/svelte/lightbox/composition.md): Slides + Zoom chrome, media sizing, and the Item snippet.
- [SvelteKit images](docs/framework/svelte/lightbox/sveltekit-images.md): Plain img with width and height, srcset, and enhanced:img.
- [View transitions](docs/framework/svelte/lightbox/view-transitions.md): Morph on by default, crossfade, morphTo, and presets.
- [Gestures](docs/framework/svelte/lightbox/gestures.md): Pull-to-dismiss, zoom, keyboard, and what wins when.
- [RTL support](docs/framework/svelte/lightbox/rtl.md): Reading direction, what mirrors and what stays physical.
- [API reference](docs/framework/svelte/lightbox/api.md): Props, data attributes, and CSS variables for every part.

Browse product demos under [Examples](docs/framework/svelte/examples/lightbox/photos-app.md). The guides above are canonical for behavior; examples are compositions.
