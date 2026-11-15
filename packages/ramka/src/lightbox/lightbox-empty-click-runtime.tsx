/**
 * Async chunk entry for `Lightbox.Content closeOnEmptyClick`. Loaded only when
 * Content mounts with the prop on; everyone else never downloads it.
 */

import { useEmptyClickClose, type EmptyClickCloseOptions } from './use-empty-click-close';

function EmptyClickClose(props: EmptyClickCloseOptions) {
  useEmptyClickClose(props);
  return null;
}

export { EmptyClickClose };
export type { EmptyClickCloseOptions };
