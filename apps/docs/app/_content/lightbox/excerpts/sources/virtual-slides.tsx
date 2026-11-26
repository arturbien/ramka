import * as Lightbox from '@ramka/react/lightbox';

declare const photos: { id: string; src: string; alt: string }[];

/**
 * VirtualSlides: the whole gallery in `itemIds`, slides from a function.
 *
 * @docsExcerpt virtual-slides
 * @docsExcerptTitle Slides → VirtualSlides
 */
export function VirtualSlidesExcerpt() {
  return (
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
  );
}
