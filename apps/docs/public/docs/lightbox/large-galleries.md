# Large galleries

Thousands of photos, or a feed that keeps growing. Part of [Lightbox](docs/lightbox.md).

## When you need it

[Slides](docs/lightbox/api.md#api-slides) renders one slide for every photo. A few hundred is fine. Thousands make opening slow and keep every slide in memory.

[VirtualSlides](docs/lightbox/api.md#api-virtual-slides) renders only the slides around the one on screen: 7 by default, with photos in the middle 3. Two empty spacers stand in for the rest, so scrolling, snapping, and swiping work exactly like Slides.

Two props tune the window. `preload` (default 1) is how many slides on each side get their photo. `overscan` (default 2) adds empty slides past that.

## Switching from Slides

Three changes:

1. Pass `itemIds` to [Root](docs/lightbox/api.md#api-root): every photo’s id, in order. That’s how the viewer knows the count without rendering them. Forget it and nothing renders (you’ll get a warning in development).
2. Children become a function, `(index, itemId) => …`, that returns one slide. It only runs for the slides being rendered.
3. Make every slide as wide as the scroller: `flex: 0 0 100%`. Positions of the slides that aren’t rendered are worked out from that one width.

```tsx Slides → VirtualSlides
import * as Lightbox from '@ramka/react/lightbox';

<Lightbox.Root
  // 1. Every itemId, in viewer order.
  itemIds={photos.map((photo) => photo.id)}
>
  <Lightbox.Portal>
    <Lightbox.Backdrop />
    <Lightbox.Content>
      {/* 2. Children become a function. It only runs for mounted slides. */}
      <Lightbox.VirtualSlides>
        {(index, itemId) => (
          // 3. Every slide as wide as the scroller.
          <Lightbox.Slide style={{ flex: '0 0 100%' }}>
            <Lightbox.Item index={index} itemId={itemId}>
              <Lightbox.Media>
                <img src={photos[index]!.src} alt={photos[index]!.alt} />
              </Lightbox.Media>
            </Lightbox.Item>
          </Lightbox.Slide>
        )}
      </Lightbox.VirtualSlides>
    </Lightbox.Content>
  </Lightbox.Portal>
</Lightbox.Root>
```

## Rules

- **Same-width slides.** No snug or mixed-width slides. Development builds warn if the widths differ.
- **Space slides with CSS** `gap`, not margins. The spacers include the gap; they don’t know about margins.
- **No `:nth-child` on slides.** The spacers are siblings, so the counts are off. To style the active photo, use [Item](docs/lightbox/api.md#api-item)’s `data-active`.
- **No `ssrSlideShift`.** If the server renders the viewer already open, the first paint may jump on hydration. Opening on the client is unaffected.
- **Thumbnails aren’t virtualized.** A strip with thousands of thumbnails renders all of them, so leave it out of very large galleries.
- **About 8,000 slides max.** Firefox can’t lay out a track wider than ~8 million pixels: 8,000 slides on a 1000px-wide viewer. Development builds warn past that.

## Virtualized grids

VirtualSlides handles the viewer. The grid of thumbnails behind it is yours, and with thousands of photos you will want to virtualize that too (TanStack Virtual, react-window, …).

That breaks one thing: closing. The viewer morphs back into the photo’s tile, but if you swiped 200 photos ahead, that tile’s row isn’t rendered. There is nothing to land on.

Fix it with `reveal` on [scrollTriggerIntoView](docs/lightbox/view-transitions.md#scroll-trigger). When the tile isn’t mounted, the lightbox calls `reveal` instead of scrolling, and you scroll your virtualizer to the right row.

```tsx Virtualized grid + reveal
import * as Lightbox from '@ramka/react/lightbox';

const reveal = ({ itemId }: { itemId: string }) => virtualizer.scrollToIndex(rowOf(itemId), { align: 'center' });

<Lightbox.Root
  scrollTriggerIntoView={[
    // When the tile isn't mounted, scroll your virtualizer to its row instead.
    { type: 'onChange', behavior: 'instant', reveal },
    { type: 'onOpenComplete', behavior: 'instant', reveal },
    { type: 'onClose', behavior: 'instant', reveal },
  ]}
>
  {/* virtualized grid of Triggers + the viewer */}
</Lightbox.Root>
```

On close, what you return decides what happens next:

- **Nothing** — the close waits a few frames for the tile to appear and stop moving, then morphs into it.
- **A Promise** — the close waits for it first. Use this when your scroll is async.
- **`false`** — the tile can’t be shown. The viewer closes right away.

Keep `behavior: 'instant'`. A smooth scroll is still moving when the morph starts.

## Loading more

Append new ids to `itemIds`. The track grows and the photo on screen stays where it is, even while the viewer is open.

To fetch before the user hits the end, watch the index in `onValueChange`:

```tsx Load more while open
import * as Lightbox from '@ramka/react/lightbox';

<Lightbox.Root
  itemIds={photos.map((photo) => photo.id)}
  onValueChange={(_itemId, { index }) => {
    // 15 photos from the end? Get the next page.
    if (index >= photos.length - 15) loadMore();
  }}
>
  {/* grid + viewer with Lightbox.VirtualSlides */}
</Lightbox.Root>
```

The [Infinite scroll](examples/lightbox/infinite-scroll.md) example puts it all together: VirtualSlides, a virtualized grid with `reveal`, and loading ahead from both the grid and the viewer.
