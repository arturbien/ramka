import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, ProductInfo } from './Gallery.svelte';

/** Store skin: the library primitives with a styled Trigger and the composed commerce Gallery. */
export const Lightbox = { ...Primitives, Trigger, Gallery };
