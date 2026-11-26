import * as Lightbox from '@ramka/react/lightbox';

/**
 * Root morphTo="closest" for items without their own trigger.
 *
 * @docsExcerpt morph-to-closest
 * @docsExcerptTitle morphTo="closest"
 */
export function MorphToClosestExcerpt() {
  return (
    <Lightbox.Root morphTo="closest">
      <Lightbox.Trigger itemId="photo-1">{/* first thumb */}</Lightbox.Trigger>
      <Lightbox.Trigger itemId="photo-2">{/* +N tile */}</Lightbox.Trigger>
      {/* photo-3…n close to the nearest trigger */}
      <Lightbox.Portal>
        <Lightbox.Backdrop />
        <Lightbox.Content>
          <Lightbox.Slides>
            <Lightbox.Slide>
              <Lightbox.Item index={0} itemId="photo-1" />
            </Lightbox.Slide>
            <Lightbox.Slide>
              <Lightbox.Item index={1} itemId="photo-2" />
            </Lightbox.Slide>
            <Lightbox.Slide>
              <Lightbox.Item index={2} itemId="photo-3" />
            </Lightbox.Slide>
          </Lightbox.Slides>
        </Lightbox.Content>
      </Lightbox.Portal>
    </Lightbox.Root>
  );
}
