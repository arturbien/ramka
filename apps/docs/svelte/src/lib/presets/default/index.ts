import { Lightbox as Primitives } from '@ramka/svelte';
import Gallery from './Gallery.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem, SlidesLayout } from './Gallery.svelte';

/** Default skin: the library primitives with a styled Trigger and the composed Gallery. */
export const Lightbox = { ...Primitives, Trigger, Gallery };
