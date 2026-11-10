# @ramka/svelte

Unstyled, accessible lightbox parts for Svelte 5: view transition morphs, native scroll snap swipe, pull to dismiss, pinch zoom, a scroll linked thumbnail strip, RTL and CSP support.

This is a Svelte port of [ramka](https://ramka.dev) by Artur Bień. It keeps ramka's compound API, part names, data attributes, CSS variables, gesture constants and morph timings, so ramka's documentation applies with the differences listed below.

```sh
npm install @ramka/svelte
```

Requires `svelte` 5.40 or newer.

## Anatomy

```svelte
<script>
  import { Lightbox } from '@ramka/svelte';
</script>

<Lightbox.Root bind:open bind:index>
  {#each photos as photo, i (photo.id)}
    <Lightbox.Trigger index={i} aria-label="Open {photo.alt}">
      <img src={photo.thumb} alt="" />
    </Lightbox.Trigger>
  {/each}

  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content aria-label="Image viewer">
      <Lightbox.Slides aria-roledescription="carousel">
        {#each photos as photo, i (photo.id)}
          <Lightbox.Slide>
            <Lightbox.Item
              index={i}
              caption={photo.caption}
              aria-roledescription="slide"
              aria-label="{i + 1} of {photos.length}"
            >
              <Lightbox.Zoom>
                <Lightbox.Media width={photo.w} height={photo.h}>
                  <img src={photo.src} alt={photo.alt} />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
      <Lightbox.Caption />
      <Lightbox.Counter />
      <Lightbox.Close aria-label="Close">×</Lightbox.Close>
      <Lightbox.Previous aria-label="Previous">‹</Lightbox.Previous>
      <Lightbox.Next aria-label="Next">›</Lightbox.Next>
      <Lightbox.ZoomOut aria-label="Zoom out">−</Lightbox.ZoomOut>
      <Lightbox.ZoomIn aria-label="Zoom in">+</Lightbox.ZoomIn>
      <Lightbox.ThumbnailStrip>
        <Lightbox.ThumbnailStripTrack aria-label="Thumbnails">
          {#each photos as photo, i (photo.id)}
            <Lightbox.Thumbnail index={i}><img src={photo.thumb} alt={photo.alt} /></Lightbox.Thumbnail>
          {/each}
        </Lightbox.ThumbnailStripTrack>
      </Lightbox.ThumbnailStrip>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

The parts are also exported from `@ramka/svelte/lightbox` for `import * as Lightbox from '@ramka/svelte/lightbox'`. The library ships no visible text and no default labels: pass `aria-label` or content to every control, and dev builds warn when one is missing.

## Parts

| Part                                             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Root`                                           | State owner. `bind:open`, `bind:index`, `loop`, `count`, `dir`, `viewTransition` (`true`, `false` or a preset: `default`, `snappy`, `relaxed`, `spring`), `morphTo` (`active`, `origin`, `closest`), `scrollTriggerIntoView`, `awaitImageDecode`, `handle`, and the callbacks `onOpenChange`, `onOpenChangeComplete`, `onValueChange(index, { source })`, `onBeforeOpen`, `onBeforeClose`. `bind:this` exposes `show(index)` and `close()`.                                                                        |
| `Trigger`                                        | Opens the lightbox at `index` and morphs from its image. `id`, `handle` (detached triggers), `crossfade`. Snippet args: `{ open, active, morphRef, imageRef }`.                                                                                                                                                                                                                                                                                                                                                    |
| `Portal`                                         | Mounts the dialog on `document.body`, a `container`, or in place with `container={null}`. `keepMounted` parks it inert.                                                                                                                                                                                                                                                                                                                                                                                            |
| `Backdrop`, `Content`                            | Scrim and dialog. `Content` owns focus trap, scroll lock, keyboard, pull to dismiss (`pullToClose`).                                                                                                                                                                                                                                                                                                                                                                                                               |
| `Stage`                                          | Optional region that scopes gallery keys and pan bounds. Snippet args: `{ morphRef }`; attach `morphRef` to make an element the morph target and the element pull to dismiss moves.                                                                                                                                                                                                                                                                                                                                |
| `Slides`, `Slide`, `Item`                        | Scroll snap track, slide wrapper, and item with `index` and `caption` (string or snippet). `Slides` takes `preload` (items rendered on each side of the active one, default 1) and `ssrSlideShift` (server render shifts the track to the active slide before hydration). `Item` snippet args: `{ index, active, visible, morphRef, imageRef }`, where `visible` is true inside the preload range.                                                                                                                 |
| `Zoom`, `Media`                                  | Pinch, wheel, double tap and keyboard zoom (`minZoom`, `maxZoom`, `zoomStep`, `scrollToZoom`, `wheelSensitivity`, `keyboardPanDistance`, `doubleClickDelay`, `onZoomChange`); `bind:this` exposes `zoomIn`, `zoomOut`, `zoomTo`, `reset`, `changeOffsets(dx, dy)` and the read only `zoom`, `maxZoom`, `offsetX`, `offsetY` (content pixels), `canZoomIn`, `canZoomOut`. A bare wheel pans when zoomed, Ctrl or Command plus wheel and trackpad pinch zoom. `Media` sizes the image box from `width` and `height`. |
| `Close`, `Previous`, `Next`, `ZoomIn`, `ZoomOut` | Buttons with `data-disabled` at their bounds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `Counter`, `Caption`                             | Live regions. `Counter` snippet args: `{ current, total }`. `Caption` children are the fallback before items register.                                                                                                                                                                                                                                                                                                                                                                                             |
| `ThumbnailGroup`, `Thumbnail`                    | Tablist with roving focus, arrow keys, Home and End.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ThumbnailStrip`, `ThumbnailStripTrack`          | Photos style strip that centers the active thumbnail and follows the swipe. `scrubOnSelect`, `selectViewTransition`, `wrapSelectCommit`, `indicator` snippet.                                                                                                                                                                                                                                                                                                                                                      |
| `CSPProvider`                                    | Passes a `nonce` to the injected `<style>` tag.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

`createHandle()` returns a `LightboxHandle` with `open(index, { triggerId })`, `close()`, `goTo(index)` and `isOpen` for opening from anywhere. `getLightbox`, `getItem`, `getTrigger`, `getStage` and `getMedia` read the part contexts in custom parts. `getLightbox` throws outside a Root, the others return `null` outside their part.

`getLightbox()` returns a read only `LightboxState`: `open`, `index`, `count`, `loop`, `dir`, `canPrev`, `canNext`, `caption`, `zoomed`, `pulling`, `pullDismissing`, plus `go(index, source?)`, `show(index?)` and `close()`.

## Styling

Structural defaults live in `:where()` rules with zero specificity, injected once at runtime. Style the parts with classes and the state attributes: `data-open`, `data-closed`, `data-active`, `data-pulling`, `data-pull-snapping`, `data-pull-dismissing`, `data-zooming`, `data-zoomed`, `data-zoom`, `data-dragging`, `data-disabled`, `data-has-caption`, `data-scrubbing`, `data-positioned`. CSS variables include `--lightbox-vt-duration`, `--lightbox-vt-easing`, `--lightbox-zoom-progress`, `--lightbox-pull-progress`, `--lightbox-thumbnail-strip-travel`, `--lightbox-select-vt-duration` and `--lightbox-select-vt-easing`.

## Differences from ramka

- Snippets and attachments replace the `render` prop and refs. `Trigger` and `Item` pass `morphRef` and `imageRef` attachments in their snippet args.
- `bind:open` and `bind:index` replace `open` and `defaultOpen`, `value` and `defaultValue`.
- No lazy loading of the morph, pull and zoom engines, and no browser specific paths for Firefox, Android Blink or composited WebKit morphs. The Svelte build is small enough to ship in one piece.

## Development

```sh
pnpm dev     # playground in src/routes
pnpm check   # svelte-check
pnpm test    # vitest: unit tests in node, component tests in Chromium
pnpm build   # svelte-package and publint
```

## License

MIT. Copyright (c) 2026 Artur Bień (ramka) and Enis Budancamanak (Svelte port). This package contains code ported from ramka, which is released under the MIT License; the full text is in [LICENSE](./LICENSE).
