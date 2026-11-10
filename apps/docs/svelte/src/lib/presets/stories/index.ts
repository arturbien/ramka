import { Lightbox as Primitives } from '@ramka/svelte';
import Root from './Root.svelte';
import Trigger from './Trigger.svelte';
import Gallery from './Gallery.svelte';

export type { LightboxItem } from './Gallery.svelte';

/** Stories skin: the library primitives with a video-pausing Root, a circular Trigger and the composed Gallery. */
export const Lightbox = { ...Primitives, Root, Trigger, Gallery };
