import type { GalleryItem } from '#lib/gallery/items.js';

/** Inline style that paints a photo's 16px placeholder behind it while it loads. */
export const lqip = (item: GalleryItem) => `background-image: url(${item.src.replace(/\.jpg$/, '-lqip.jpg')})`;
