import * as Lightbox from '@ramka/react/lightbox';

// ids: 'photo-1', 'photo-2', …
declare const images: { id: string; src: string; alt: string }[];

/**
 * Product gallery: thumbnails + a “View gallery” CTA share one createHandle.
 *
 * @docsExcerpt create-handle
 * @docsExcerptTitle createHandle
 */
export function CreateHandleExcerpt() {
  const lightbox = Lightbox.createHandle();

  return (
    <>
      <button type="button" onClick={() => lightbox.open('photo-1')}>
        View gallery
      </button>

      {images.map((img) => (
        <Lightbox.Trigger key={img.id} handle={lightbox} itemId={img.id}>
          <img src={img.src} alt={img.alt} />
        </Lightbox.Trigger>
      ))}

      <Lightbox.Root handle={lightbox}>
        <Lightbox.Portal>
          <Lightbox.Backdrop />
          <Lightbox.Content>
            <Lightbox.Slides>
              {images.map((img, i) => (
                <Lightbox.Slide key={img.id}>
                  <Lightbox.Item index={i} itemId={img.id}>
                    <Lightbox.Zoom>
                      <Lightbox.Media>
                        <img src={img.src} alt={img.alt} />
                      </Lightbox.Media>
                    </Lightbox.Zoom>
                  </Lightbox.Item>
                </Lightbox.Slide>
              ))}
            </Lightbox.Slides>
            <Lightbox.Close aria-label="Close" />
          </Lightbox.Content>
        </Lightbox.Portal>
      </Lightbox.Root>
    </>
  );
}
