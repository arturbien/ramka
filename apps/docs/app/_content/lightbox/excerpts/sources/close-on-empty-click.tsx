import * as Lightbox from '@ramka/react/lightbox';

declare const src: string;
declare const alt: string;

/**
 * Close on a click in the letterbox / empty slide space, not only the scrim.
 *
 * @docsExcerpt close-on-empty-click
 * @docsExcerptTitle Close on empty click
 */
export function CloseOnEmptyClickExcerpt() {
  return (
    <Lightbox.Root>
      <Lightbox.Portal>
        <Lightbox.Backdrop />
        <Lightbox.Content closeOnEmptyClick>
          {/* Custom chrome: mark the row so clicks between buttons don't close */}
          <div data-ramka-no-pull="">
            <Lightbox.ZoomOut aria-label="Zoom out" />
            <Lightbox.ZoomIn aria-label="Zoom in" />
            <Lightbox.Close aria-label="Close" />
          </div>
          <Lightbox.Slides>
            <Lightbox.Slide>
              <Lightbox.Item index={0}>
                <Lightbox.Zoom>
                  <Lightbox.Media>
                    <img src={src} alt={alt} />
                  </Lightbox.Media>
                </Lightbox.Zoom>
              </Lightbox.Item>
            </Lightbox.Slide>
          </Lightbox.Slides>
        </Lightbox.Content>
      </Lightbox.Portal>
    </Lightbox.Root>
  );
}
