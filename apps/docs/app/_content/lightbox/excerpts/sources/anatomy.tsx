import * as Lightbox from '@ramka/react/lightbox';

/**
 * Canonical compound-parts sketch for the Overview page.
 * Default layout: Slides → Slide → Item → Zoom → Media.
 *
 * @docsExcerpt anatomy
 * @docsExcerptTitle Anatomy
 */
export function AnatomyExcerpt() {
  return (
    <Lightbox.Root>
      <Lightbox.Trigger itemId="photo-1">{/* thumb */}</Lightbox.Trigger>
      <Lightbox.Portal>
        <Lightbox.Backdrop />
        <Lightbox.Content>
          <Lightbox.Slides>
            <Lightbox.Slide>
              <Lightbox.Item index={0} itemId="photo-1">
                <Lightbox.Zoom>
                  <Lightbox.Media>
                    <img alt="" />
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
  );
}
