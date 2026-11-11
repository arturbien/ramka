import { Lightbox as Primitives } from '@ramka/svelte';
import Backdrop from './Backdrop.svelte';
import Caption from './Caption.svelte';
import Close from './Close.svelte';
import Content from './Content.svelte';
import Counter from './Counter.svelte';
import Gallery from './Gallery.svelte';
import Item from './Item.svelte';
import Media from './Media.svelte';
import Next from './Next.svelte';
import Portal from './Portal.svelte';
import Previous from './Previous.svelte';
import Slide from './Slide.svelte';
import Slides from './Slides.svelte';
import Trigger from './Trigger.svelte';

export type { LightboxItem } from './Gallery.svelte';

/** Editorial skin: newsroom figure viewer with styled parts and the composed Gallery. */
export const Lightbox = {
  Root: Primitives.Root,
  Trigger,
  Portal,
  Backdrop,
  Content,
  Close,
  Slides,
  Slide,
  Item,
  Media,
  Counter,
  Caption,
  Previous,
  Next,
  Gallery,
};
