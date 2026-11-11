/** One photo of the intercepted-routes grid; `id` is the stable URL segment. */
export interface InterceptedPhoto {
  id: string;
  alt: string;
  caption: string;
  src: string;
  width: number;
  height: number;
}

/** Route of the grid; every photo lives at `${EXAMPLE_BASE_PATH}/photos/<id>`. */
export const EXAMPLE_BASE_PATH = '/docs/framework/svelte/examples/lightbox/intercepted-routes';

/** Title of the grid page. */
export const EXAMPLE_PAGE_TITLE = 'Intercepted routes example';

/** Title of a photo URL, shared by the standalone page and the modal. */
export function interceptedPhotoTitle(photo: InterceptedPhoto): string {
  return `${photo.caption}: ${EXAMPLE_PAGE_TITLE}`;
}

/** URL of a photo, both for the modal (shallow) and the standalone page (hard load). */
export const photoHref = (photo: InterceptedPhoto) => `${EXAMPLE_BASE_PATH}/photos/${photo.id}`;

/** The photo catalogue shared by the grid, the modal and the standalone page. */
export const interceptedPhotos: InterceptedPhoto[] = [
  { id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge', file: 'mb-01', height: 1200 },
  { id: '2', alt: 'Empty coastal highway', caption: 'Open road', file: 'mb-02', height: 533 },
  { id: '3', alt: 'Narrow sunlit alley', caption: 'Warm alley', file: 'mb-04', height: 1200 },
  { id: '4', alt: 'Wide desert dunes', caption: 'Dunes', file: 'mb-05', height: 467 },
  { id: '5', alt: 'Calm lake reflection', caption: 'Still water', file: 'mb-07', height: 533 },
  { id: '6', alt: 'Tall concrete staircase', caption: 'Ascent', file: 'mb-08', height: 1200 },
  {
    id: '7',
    alt: 'Panoramic city skyline at dusk',
    caption: 'Dusk skyline',
    file: 'mb-10',
    height: 451,
  },
  {
    id: '8',
    alt: 'Single tree in a green field',
    caption: 'Lone tree',
    file: 'mb-11',
    height: 1161,
  },
].map(({ file, ...photo }) => ({
  ...photo,
  src: `/svelte/examples/url-synced-state/${file}.jpg`,
  width: 800,
}));
