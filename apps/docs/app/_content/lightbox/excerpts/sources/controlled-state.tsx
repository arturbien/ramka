import * as Lightbox from '@ramka/react/lightbox';

declare const open: boolean;
declare const setOpen: (open: boolean) => void;
declare const value: string;
declare const setValue: (itemId: string) => void;

/**
 * Controlled open + active item on Root. `value` is the active Item's `itemId`.
 *
 * @docsExcerpt controlled-state
 * @docsExcerptTitle Controlled open + value
 */
export function ControlledStateExcerpt() {
  return (
    <Lightbox.Root open={open} onOpenChange={setOpen} value={value} onValueChange={setValue}>
      {/* triggers + content */}
    </Lightbox.Root>
  );
}
