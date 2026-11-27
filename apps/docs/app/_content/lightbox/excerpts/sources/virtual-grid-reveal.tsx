import * as Lightbox from '@ramka/react/lightbox';

declare const virtualizer: { scrollToIndex: (index: number, options?: { align: 'center' }) => void };
declare const rowOf: (itemId: string) => number;

/**
 * Virtualized grid: `reveal` scrolls an unmounted tile back into the page.
 *
 * @docsExcerpt virtual-grid-reveal
 * @docsExcerptTitle Virtualized grid + reveal
 */
export function VirtualGridRevealExcerpt() {
  const reveal = ({ itemId }: { itemId: string }) => virtualizer.scrollToIndex(rowOf(itemId), { align: 'center' });

  return (
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
  );
}
