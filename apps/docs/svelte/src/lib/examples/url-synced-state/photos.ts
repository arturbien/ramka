/** One photo of the URL-synced state wall; `id` is the stable URL segment. */
export interface GalleryPhoto {
  id: string;
  alt: string;
  caption: string;
  src: string;
  width: number;
  height: number;
}

/** Route of the grid; every photo lives at `${BASE_PATH}/<id>`. */
export const BASE_PATH = '/docs/framework/svelte/examples/lightbox/url-synced-state';

/** Title of the grid page. */
export const GALLERY_PAGE_TITLE = 'URL-synced state example';

/** Title of a photo's deep link, shared by the server render and the client. */
export function photoPageTitle(photo: GalleryPhoto): string {
  return `${photo.caption}: ${GALLERY_PAGE_TITLE}`;
}

const sizes: [number, number][] = [
  [800, 1200],
  [800, 533],
  [800, 800],
  [800, 1200],
  [800, 467],
  [800, 1025],
  [800, 533],
  [800, 1200],
  [800, 800],
  [800, 451],
  [800, 1161],
  [800, 800],
];

/** The photo catalogue: grid tiles, slides, prerender entries and 404s all read this one list. */
export const galleryPhotos: GalleryPhoto[] = [
  { id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge' },
  { id: '2', alt: 'Empty coastal highway', caption: 'Open road' },
  { id: '3', alt: 'Overhead of a linen breakfast table', caption: 'Slow morning' },
  { id: '4', alt: 'Narrow sunlit alley', caption: 'Warm alley' },
  { id: '5', alt: 'Wide desert dunes', caption: 'Dunes' },
  { id: '6', alt: 'Rain on a window', caption: 'Rainy glass' },
  { id: '7', alt: 'Calm lake reflection', caption: 'Still water' },
  { id: '8', alt: 'Tall concrete staircase', caption: 'Ascent' },
  { id: '9', alt: 'Close-up of dried flowers', caption: 'Pressed petals' },
  { id: '10', alt: 'Panoramic city skyline at dusk', caption: 'Dusk skyline' },
  { id: '11', alt: 'Single tree in a green field', caption: 'Lone tree' },
  { id: '12', alt: 'Textured stone wall', caption: 'Stonework' },
].map((photo, i) => ({
  ...photo,
  src: `/svelte/examples/url-synced-state/mb-${String(i + 1).padStart(2, '0')}.jpg`,
  width: sizes[i]![0],
  height: sizes[i]![1],
}));

/** `/…/url-synced-state/5` gives 4; the bare grid URL or an unknown id gives -1. */
export function photoIndexFromPathname(pathname: string): number {
  if (!pathname.startsWith(`${BASE_PATH}/`)) return -1;
  let id: string;
  try {
    id = decodeURIComponent(pathname.slice(BASE_PATH.length + 1));
  } catch {
    return -1;
  }
  return galleryPhotos.findIndex((photo) => photo.id === id);
}
