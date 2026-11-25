import type { StaticImageData } from 'next/image';

import { cityImages, coastImages, fogImages, forestImages, mountainsImages, oldtownImages } from './images.generated';

/**
 * Plain data (no `'use client'`): the server page uses it to validate the
 * `?photo=` param and build per-photo metadata, the client demo to render the
 * feed and the viewer. One list, so a link can never point at a missing photo.
 */
export interface AlbumPhoto {
  /** Unique across all albums, so `?photo=` alone names the album too. */
  id: string;
  alt: string;
  caption: string;
  image: StaticImageData;
}

export interface Album {
  id: string;
  title: string;
  location: string;
  author: { name: string; initials: string; colorClass: string };
  posted: string;
  photos: AlbumPhoto[];
}

function album(
  meta: Omit<Album, 'photos'>,
  images: StaticImageData[],
  photos: ReadonlyArray<{ alt: string; caption: string }>,
): Album {
  return {
    ...meta,
    photos: photos.map((photo, i) => ({ ...photo, id: `${meta.id}-${i + 1}`, image: images[i]! })),
  };
}

export const albums: Album[] = [
  album(
    {
      id: 'mountains',
      title: 'Above the clouds',
      location: 'Dolomites, Italy',
      author: { name: 'Noa Brandt', initials: 'NB', colorClass: 'bg-sky-100 text-sky-700' },
      posted: '2 days ago',
    },
    mountainsImages,
    [
      { alt: 'Mist rolling over a forested ridge', caption: 'First light on the ridge' },
      { alt: 'Snowy peaks under a teal sky', caption: 'The north faces' },
      { alt: 'Jagged snow-covered summit', caption: 'Summit day' },
      { alt: 'Peak rising above a sea of fog', caption: 'Cloud inversion' },
      { alt: 'Distant spires in violet haze', caption: 'Dusk over the spires' },
      { alt: 'Cliff edge disappearing into cloud', caption: 'Into the white' },
      { alt: 'Hiker looking over a mountain lake', caption: 'Lake stop' },
    ],
  ),
  album(
    {
      id: 'forest',
      title: 'Forest mornings',
      location: 'Bavarian Forest, Germany',
      author: { name: 'Theo Lindqvist', initials: 'TL', colorClass: 'bg-emerald-100 text-emerald-700' },
      posted: '5 days ago',
    },
    forestImages,
    [
      { alt: 'Frost on the forest floor between pines', caption: 'Frost' },
      { alt: 'Trail winding between tall pines', caption: 'The long trail' },
      { alt: 'Path through a dark green forest', caption: 'Deep woods' },
      { alt: 'Worn dirt path through grass', caption: 'Off the map' },
      { alt: 'Footpath through a meadow at sunset', caption: 'Meadow crossing' },
      { alt: 'Tree silhouette in golden fog', caption: 'Golden hour fog' },
      { alt: 'Oak in morning haze', caption: 'The old oak' },
    ],
  ),
  album(
    {
      id: 'oldtown',
      title: 'Doors of the old town',
      location: 'Porto, Portugal',
      author: { name: 'Inês Duarte', initials: 'ID', colorClass: 'bg-amber-100 text-amber-700' },
      posted: '1 week ago',
    },
    oldtownImages,
    [
      { alt: 'Green wooden door in an ornate facade', caption: 'Rua das Flores' },
      { alt: 'Carved wooden double door', caption: 'Number 27' },
      { alt: 'Street with string lights at night', caption: 'After dark' },
      { alt: 'Colourful houses along a canal', caption: 'Along the water' },
      { alt: 'Looking up between ornate buildings', caption: 'Look up' },
    ],
  ),
  album(
    {
      id: 'coast',
      title: 'Coastline',
      location: 'Big Sur, California',
      author: { name: 'Malia Kekona', initials: 'MK', colorClass: 'bg-cyan-100 text-cyan-700' },
      posted: '2 weeks ago',
    },
    coastImages,
    [
      { alt: 'Rocky shore under a pale sky', caption: 'Low tide' },
      { alt: 'Wave breaking over dark rocks', caption: 'Spray' },
      { alt: 'Long pier in black and white', caption: 'The pier' },
      { alt: 'Pebble beach curving into the sea', caption: 'Pebble cove' },
      { alt: 'Tripod on a grassy bluff over the water', caption: 'Setting up' },
      { alt: 'Sailboat mast from the deck', caption: 'Heading out' },
    ],
  ),
  album(
    {
      id: 'fog',
      title: 'Fog days',
      location: 'Hokkaido, Japan',
      author: { name: 'Jun Mori', initials: 'JM', colorClass: 'bg-neutral-200 text-neutral-700' },
      posted: '3 weeks ago',
    },
    fogImages,
    [
      { alt: 'Blue-grey fog over a dark hill', caption: 'Blue hour' },
      { alt: 'Violet fog over a lakeshore', caption: 'Lavender shore' },
      { alt: 'Hay bale in a misty field', caption: 'Harvest' },
      { alt: 'Stairs fading into fog', caption: 'Nowhere stairs' },
    ],
  ),
  album(
    {
      id: 'city',
      title: 'Concrete and colour',
      location: 'Rotterdam, Netherlands',
      author: { name: 'Sam Okafor', initials: 'SO', colorClass: 'bg-rose-100 text-rose-700' },
      posted: '1 month ago',
    },
    cityImages,
    [
      { alt: 'Tower blocks seen through a rainy window', caption: 'Rain check' },
      { alt: 'Steel lattice of a tower from below', caption: 'Lattice' },
      { alt: 'Red, yellow and white striped facade', caption: 'Stripes' },
      { alt: 'Spiral staircase in a white stairwell', caption: 'Stairwell' },
      { alt: 'Skyline in morning haze', caption: 'Morning haze' },
    ],
  ),
];

const photoLookup = new Map<string, { album: Album; photo: AlbumPhoto }>(
  albums.flatMap((album) => album.photos.map((photo) => [photo.id, { album, photo }] as const)),
);

export function findPhoto(id: string | null | undefined): { album: Album; photo: AlbumPhoto } | undefined {
  return id ? photoLookup.get(id) : undefined;
}

export const ALBUMS_PAGE_TITLE = 'Shareable albums example';
