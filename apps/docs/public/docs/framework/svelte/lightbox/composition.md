# Composition

Default to Slides + Zoom (swipe carousel with pinch zoom), size media to fill Content, then layer chrome. Part of [Lightbox](docs/framework/svelte/lightbox.md).

## Slides + Zoom

Prefer [Slides](docs/framework/svelte/lightbox/api.md#api-slides) + [Slide](docs/framework/svelte/lightbox/api.md#api-slide) for a swipeable snap carousel wired to the active index. Nearly every docs demo and example uses this layout. Slide boxes stay mounted; `preload` gates heavy Item content.

- Nesting rule: put `Item` and [Zoom](docs/framework/svelte/lightbox/api.md#api-zoom) *inside* each `Slide`. Pull transforms the item, not the snap box.
- User flings set an internal scroll lock so pull-to-dismiss, zoom chrome, and discrete prev/next do not fight the carousel mid-gesture.
- Scroll-driven index changes report `onValueChange` with `source: 'scroll'`, see [NavigationSource](docs/framework/svelte/lightbox/api.md#types).
- The Item snippet’s `active` is the current index (drive expensive work here). `visible` means the item is in the preload window: use it for lightweight prefetch, not video autoplay.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { items }: { items: { id: string; src: string; alt: string }[] } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides preload={1}>
        {#each items as item, i (item.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i}>
              <Lightbox.Zoom>
                <Lightbox.Media>
                  <img src={item.src} alt={item.alt} />
                </Lightbox.Media>
              </Lightbox.Zoom>
            </Lightbox.Item>
          </Lightbox.Slide>
        {/each}
      </Lightbox.Slides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

```css Slide track (full-bleed carousel)
[data-ramka-slide] {
  flex: 0 0 100%;
  min-width: 100%;
}
```

## Media layout

ramka is *cosmetically* unstyled (colors and chrome are yours), but Media may apply *structural* fit-box styles through `width` /`height` so the morph target has a correct aspect before pixels load. Slide width is your CSS too: [Slide](docs/framework/svelte/lightbox/api.md#api-slide) only bakes in snap alignment ( `scroll-snap-align: center`, `scroll-snap-stop: always`); you size each snap box. For a full-bleed carousel, use `flex: 0 0 100%` and `min-width: 100%` on each slide (see the snippet above). Snug, variable-width tracks use a different width formula, see the [Default preset](docs/framework/svelte/presets/default.md). Item and Zoom fill the slide content box; size the stack so when Zoom scales past 1× the image can cover the viewport and is not clipped by a shorter ancestor.

- `Content`: fullscreen surface (`fixed inset-0` or a full dialog)
- `Slides`: `flex-1` (or an equivalent stretch)
- `Slide`: `flex: 0 0 100%; min-width: 100%` for a full-bleed track; `h-full` for height; put chrome and safe-area insets here as padding (not on Zoom)
- `Item`: already fills the Slide ( `width/height: 100%`)
- `Zoom`: already fills and centers (structural)
- `Media`: sized fit-box (morph and placeholder host); `<img>` or `<video>` inside

Keep Close, Counter, Caption, and thumbnails as *absolutely positioned siblings* of Slides (see Chrome below), not in-flow above or below Zoom. Resting insets belong on Slide padding and safe-area so zoomed media can still paint into that padding under chrome. Gesture details live in [Gestures](docs/framework/svelte/lightbox/gestures.md).

Set HTML `width` and `height` on the destination `<img>` (from known pixel dimensions or CMS metadata) so the box and aspect ratio exist *before* pixels load. That avoids layout shift, keeps the morph target sized on slow networks, and prevents an unloaded image from collapsing to 0×0 (which can skip or weaken the open morph). When dimensions are unknown, see [URL-synced state](docs/framework/svelte/examples/lightbox/url-synced-state.md). For mixed media (photos plus WebGL) with [onBeforeOpen](docs/framework/svelte/lightbox/api.md#api-root) preheat, see [3D models](docs/framework/svelte/examples/lightbox/3d-models.md).

To fill the maximum available space without distorting the source aspect ratio, nest Media under [Lightbox.Zoom](docs/framework/svelte/lightbox/api.md#api-zoom) (a size container for `cqw` /`cqh`) and pass `width` /`height` to [Lightbox.Media](docs/framework/svelte/lightbox/api.md#api-media). Media applies the inscribed fit-box ( `min(100cqw, 100cqh × w/h)` + `aspect-ratio: w / h`). Or put HTML `width` / `height` on the child image and omit the Media props: Media derives the box. When the box matches the source aspect, child `object-fit` is a no-op and Media’s grid stretch fills the box. Put border-radius on Media (the morph target). Leave chrome outside Media.

```svelte Viewer.svelte
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
```

Live compositions: [Default preset](docs/framework/svelte/presets/default.md), [Twitter preset](docs/framework/svelte/presets/twitter.md), [Stories preset](docs/framework/svelte/presets/stories.md), [Photos app](docs/framework/svelte/examples/lightbox/photos-app.md).

## Stage (split layouts)

Use [Lightbox.Stage](docs/framework/svelte/lightbox/api.md#api-stage) when Content holds more than the media pane, for example a thread sidebar beside the gallery. Stage is the media interaction surface: trackpad wheel pull-to-dismiss, Zoom pan cover geometry, and / Home / End gallery navigation are scoped to it. Content remains the dialog shell (focus trap, Esc, zoom shortcuts). Place side panels as siblings of Stage under Content so they keep native scroll and their own keyboard behavior. Without a Stage, Content itself is the stage (default full-bleed viewers need no change).

```svelte Stage + side panel
<Lightbox.Content aria-label="Post">
  <Lightbox.Stage class="media-pane">
    <Lightbox.Close aria-label="Close" />
    <Lightbox.Slides><!-- media --></Lightbox.Slides>
    <Lightbox.Previous aria-label="Previous" />
    <Lightbox.Next aria-label="Next" />
  </Lightbox.Stage>
  <aside><!-- thread / details --></aside>
</Lightbox.Content>
```

Attach Stage’s `morphRef` when the open and close morph should capture the Stage surface (or a descendant) instead of the active item: a 9:16 stories frame, the slides track, or a custom bezel. Decode and the thumbnail placeholder stay on the item. In Svelte, `morphRef` is an attachment: `&#123;@attach morphRef&#125;`.

```svelte Stage morphRef
<Lightbox.Stage>
  {#snippet children({ morphRef })}
    <div class="frame" {@attach morphRef}>
      <Lightbox.Slides><!-- media --></Lightbox.Slides>
    </div>
  {/snippet}
</Lightbox.Stage>
```

Live examples: [Twitter preset](docs/framework/svelte/presets/twitter.md), [Stories preset](docs/framework/svelte/presets/stories.md).

## Chrome

The site default viewer is Slides + Zoom with Counter, Close, ZoomIn and ZoomOut, Caption, and a desktop [ThumbnailStrip](docs/framework/svelte/lightbox/api.md#api-thumbnail-strip) (scroll-linked midline track) as siblings inside [Content](docs/framework/svelte/lightbox/api.md#api-content). Midline selection chrome goes in the strip’s `indicator` snippet. Thumbnails register by `index` like Triggers. Put Backdrop and Content in [Portal](docs/framework/svelte/lightbox/api.md#api-portal). Stacking follows the usual dialog pattern: `isolation: isolate` on the app layout root and, with `keepMounted`, your own `z-index` on the Portal host (for example `class="relative z-[1]"`). Inside the portal, document order keeps Backdrop under Content.

Thumbnails go inside a [ThumbnailStripTrack](docs/framework/svelte/lightbox/api.md#api-thumbnail-strip-track), the `role="tablist"` that the strip moves. Label the track, not the strip.

```svelte Gallery.svelte
<script lang="ts">
  import { Lightbox } from '@ramka/svelte';

  let { items }: { items: { id: string; src: string; thumb: string; alt: string; caption: string }[] } = $props();
</script>

<Lightbox.Root>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      <Lightbox.Slides>
        {#each items as item, i (item.id)}
          <Lightbox.Slide>
            <Lightbox.Item index={i} caption={item.caption}>
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
      <Lightbox.ThumbnailStrip>
        <Lightbox.ThumbnailStripTrack aria-label="Photo thumbnails">
          {#each items as item, i (item.id)}
            <Lightbox.Thumbnail index={i}>
              <img src={item.thumb} alt="" />
            </Lightbox.Thumbnail>
          {/each}
        </Lightbox.ThumbnailStripTrack>
        {#snippet indicator()}
          <span aria-hidden="true"></span>
        {/snippet}
      </Lightbox.ThumbnailStrip>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

Packaged as a skin: [Default preset](docs/framework/svelte/presets/default.md).

## Dynamic item count

Items register on mount, and the item count comes from the registered items. Indices do not need to be contiguous, but Counter, loop edges, and preload distance all use that count. Prefer dense `0…n-1` indexes unless you leave holes on purpose. Before the viewer has mounted (for a counter outside it, say), Root’s `count` prop stands in.
