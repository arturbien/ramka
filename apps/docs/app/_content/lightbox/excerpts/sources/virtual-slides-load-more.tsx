import * as Lightbox from '@ramka/react/lightbox';

/** Your photos so far, in state. */
declare const photos: { id: string }[];
/** Fetches the next page and appends it to `photos`. Does nothing while a fetch is in flight. */
declare function loadMore(): void;

/**
 * Loading more while the viewer is open: append, and the track grows.
 *
 * @docsExcerpt virtual-slides-load-more
 * @docsExcerptTitle Load more while open
 */
export function VirtualSlidesLoadMoreExcerpt() {
  return (
    <Lightbox.Root
      itemIds={photos.map((photo) => photo.id)}
      onValueChange={(_itemId, { index }) => {
        // 15 photos from the end? Get the next page.
        if (index >= photos.length - 15) loadMore();
      }}
    >
      {/* grid + viewer with Lightbox.VirtualSlides */}
    </Lightbox.Root>
  );
}
