import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import ThreadPanel from './ThreadPanel.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, ThreadAuthor, ThreadPost, ThreadReply } from './ThreadPanel.svelte';

/** Twitter skin: the library primitives with a styled Trigger, the split Gallery and its ThreadPanel. */
export const Lightbox = { ...Primitives, Trigger, Gallery, ThreadPanel };
