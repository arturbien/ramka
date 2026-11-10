import { photoSizes } from '#lib/data/photo-sizes.js';

/** One image in a docs lightbox gallery. */
export interface GalleryItem {
  src: string;
  thumb: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

/** Gallery item for a photo in static/photos, sized from photoSizes. */
export function photo(name: string, alt: string, caption?: string): GalleryItem {
  const size = photoSizes[name] ?? { width: 1600, height: 900 };
  return { src: `/svelte/photos/${name}.jpg`, thumb: `/svelte/photos/${name}-thumb.jpg`, alt, caption, ...size };
}

/** Width over height, for snug slide geometry. */
export const ratio = (item: GalleryItem) => item.width / item.height;
