import * as Lightbox from '@ramka/react/lightbox';

/**
 * The imperative API names items by `itemId`, and nothing about it mirrors:
 * `open('photo-1')` opens the first item, which RTL renders at the
 * right-hand edge. Only the direction you travel to reach it changes.
 *
 * @docsExcerpt rtl-handle
 * @docsExcerptTitle Imperative API under RTL
 */
export function RtlHandleExcerpt() {
  const lightbox = Lightbox.createHandle();

  return (
    <>
      {/* Opens the first item, at the inline-start (right) edge of the track. */}
      <button type="button" onClick={() => lightbox.open('photo-1')}>
        פתיחת הגלריה
      </button>

      {/* Jumps to the 4th item regardless of reading direction. */}
      <button type="button" onClick={() => lightbox.goTo('photo-4')}>
        מעבר לתמונה 4
      </button>

      <Lightbox.Root handle={lightbox} dir="rtl">
        {/* … Portal / Content / Slides … */}
      </Lightbox.Root>
    </>
  );
}
