# Gestures

Pull-to-dismiss, zoom and pan, and keyboard ownership. Part of [Lightbox](docs/framework/svelte/lightbox.md). For the usual gallery chrome (pull, zoom, keyboard) see the [Default preset](docs/framework/svelte/presets/default.md).

## Content pullToClose

Content enables pull-to-dismiss by default (`pullToClose`). Drag down (touch) or wheel-dismiss (trackpad) scales the surface and sets `data-pulling` / `data-pull-dismissing` plus `--lightbox-pull-progress` (0→1).

- The hit target is Stage-wide (or Content when Stage is omitted): letterbox and empty Stage area can start a pull, matching the trackpad wheel. Interactive controls (buttons, links, inputs, `[data-ramka-no-pull]`) keep their press. Side panels outside Stage do not start a pull.
- Disabled while zoomed above 1×, and while Slides is scrolling until `scrollend` (so a gallery swipe that turns vertical cannot pull mid-gesture).
- Backdrop is optional. When used, nest it inside [Portal](docs/framework/svelte/lightbox/api.md#api-portal) beside Content. Pull still works without a Backdrop.

Open and close fades are plain CSS on your Backdrop and Content classes, keyed to `data-open` and `@starting-style`. Pull then modulates the open scrim (media stays opaque) through `--lightbox-pull-progress`.

When a pull is released short of the threshold, the surface springs back and the library publishes `--lightbox-pull-snap-duration` / `--lightbox-pull-snap-easing` for the duration of that spring. Reference them in your `transition` (with your open and close values as the fallbacks, as below) and anything keyed to `--lightbox-pull-progress` (backdrop opacity, chrome, blur) eases back on the same curve and duration as the item.

```css Open / close CSS
.lightbox-backdrop {
  opacity: 0;
  transition: opacity var(--lightbox-pull-snap-duration, var(--lightbox-vt-duration, 360ms))
    var(--lightbox-pull-snap-easing, cubic-bezier(0.16, 1, 0.3, 1));
}

@starting-style {
  .lightbox-backdrop[data-open] {
    opacity: 0;
  }
}

.lightbox-content {
  opacity: 0;
  transition: opacity var(--lightbox-vt-duration, 360ms) cubic-bezier(0.16, 1, 0.3, 1);
}

.lightbox-content[data-open] {
  opacity: 1;
}

@starting-style {
  .lightbox-content[data-open] {
    opacity: 0;
  }
}
```

```css Pull progress CSS
.lightbox-backdrop[data-open] {
  opacity: calc(1 - var(--lightbox-pull-progress, 0) * 0.6);
}

.lightbox-backdrop[data-pulling] {
  transition: none;
}

.lightbox-chrome {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 200ms,
    visibility 0s linear 0s;
}

.lightbox-content:is([data-pulling], [data-pull-dismissing]) .lightbox-chrome {
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 200ms,
    visibility 0s linear 200ms;
}
```

## Zoom

Wrap media in [Zoom](docs/framework/svelte/lightbox/api.md#api-zoom) (inside Item, typically inside Slide). Prefer [Media](docs/framework/svelte/lightbox/api.md#api-media) inside Zoom so pan and `maxZoom` use the sized content box. Supports pinch, pan, double-tap, ctrl/meta+wheel (or `scrollToZoom`), and keyboard pan when focused.

Zoomed media can cover the full Content surface only if Slide → Item → Zoom → Media fill that box, see [Composition: Media layout](docs/framework/svelte/lightbox/composition.md#media-layout).

[ZoomIn](docs/framework/svelte/lightbox/api.md#api-zoom-in) / [ZoomOut](docs/framework/svelte/lightbox/api.md#api-zoom-out) can sit in toolbar chrome outside Zoom: they target the *active* slide through Root’s active-zoom bridge. Content reflects `data-zooming` / `data-zoomed` for styling.

```svelte Viewer.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { src, alt }: { src: string; alt: string } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <!-- toolbar chrome, targets the active slide's Zoom -->
      <Lightbox.ZoomOut aria-label="Zoom out" />
      <Lightbox.ZoomIn aria-label="Zoom in" />
      <Lightbox.Slides>
        <Lightbox.Slide>
          <Lightbox.Item index={0}>
            <Lightbox.Zoom>
              <Lightbox.Media>
                <img {src} {alt} />
              </Lightbox.Media>
            </Lightbox.Zoom>
          </Lightbox.Item>
        </Lightbox.Slide>
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Keyboard & focus

[Content](docs/framework/svelte/lightbox/api.md#api-content) is the keyboard authority while open:

- Esc: close
- : pan when zoomed, otherwise previous and next
- / / 0: zoom in, out, reset (active Zoom)

Image zoom uses unmodified keys only: / Ctrl and the other modified combos are left to the browser, so page zoom (WCAG 1.4.4 text resize) keeps working while the dialog is open.

Focus is trapped in the dialog; closing restores focus to the opening Trigger. Native page pinch-zoom is blocked while Content is mounted so it does not fight `Lightbox.Zoom`.

## Interaction matrix

| State | Pull | Zoom chrome / buttons | Prev / Next |
| --- | --- | --- | --- |
| Idle, zoom = 1 | Allowed | Allowed | Allowed |
| Zoomed > 1 | Blocked | Allowed | Arrows pan; buttons still navigate |
| Slides flinging | Blocked | Blocked | Blocked until settle |
| Pulling | Active | Should idle | Should idle |
