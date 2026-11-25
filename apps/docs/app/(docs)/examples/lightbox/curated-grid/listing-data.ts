import type { StaticImageData } from 'next/image';

import { listingImages } from './images.generated';

export interface ListingPhoto {
  id: string;
  room: string;
  label: string;
  alt: string;
  image: StaticImageData;
}

/** The full photo tour, room by room, in the order the viewer shows it. */
export const listingPhotos: ListingPhoto[] = (
  [
    {
      id: 'pool-terrace',
      room: 'Outdoors',
      label: 'Pool terrace',
      alt: 'White villa with a pool terrace and sun loungers',
    },
    { id: 'front', room: 'Outdoors', label: 'Front elevation', alt: 'Two-storey white villa behind a long pool' },
    { id: 'garden-facade', room: 'Outdoors', label: 'Garden facade', alt: 'Villa facade over a lap pool and lawn' },
    { id: 'courtyard-pool', room: 'Outdoors', label: 'Courtyard pool', alt: 'Courtyard pool lined with palms' },
    { id: 'living', room: 'Living', label: 'Living room', alt: 'Open living room with sofas facing glass doors' },
    { id: 'lounge', room: 'Living', label: 'Double-height lounge', alt: 'Lounge under a floating staircase' },
    { id: 'open-plan', room: 'Living', label: 'Open-plan living', alt: 'Open-plan living and dining space' },
    { id: 'family-room', room: 'Living', label: 'Family room', alt: 'Family room with a grey sectional and TV wall' },
    { id: 'fireplace', room: 'Living', label: 'Fireplace lounge', alt: 'Lounge with a fireplace and built-in shelves' },
    { id: 'great-room', room: 'Living', label: 'Great room', alt: 'Great room with tall arched windows' },
    {
      id: 'kitchen',
      room: 'Kitchen & dining',
      label: 'Kitchen',
      alt: 'White kitchen with an island and pendant lights',
    },
    { id: 'dining', room: 'Kitchen & dining', label: 'Dining room', alt: 'Dining table with green chairs' },
    {
      id: 'kitchen-lounge',
      room: 'Kitchen & dining',
      label: 'Kitchen and lounge',
      alt: 'Kitchen opening onto a lounge',
    },
    {
      id: 'primary-bedroom',
      room: 'Bedrooms',
      label: 'Primary bedroom',
      alt: 'Bright primary bedroom with a king bed',
    },
    { id: 'guest-bedroom', room: 'Bedrooms', label: 'Guest bedroom', alt: 'Guest bedroom with a tufted headboard' },
    { id: 'primary-bath', room: 'Bathrooms', label: 'Primary bathroom', alt: 'Bathroom with a glass walk-in shower' },
    { id: 'soaking-tub', room: 'Bathrooms', label: 'Soaking tub', alt: 'Freestanding tub under a window' },
    {
      id: 'guest-bath',
      room: 'Bathrooms',
      label: 'Guest bathroom',
      alt: 'Guest bathroom with a pedestal sink and plants',
    },
    { id: 'reading-corner', room: 'Details', label: 'Reading corner', alt: 'Yellow armchair in a reading corner' },
    { id: 'stair-view', room: 'Details', label: 'Staircase view', alt: 'Glass staircase overlooking the pool' },
    { id: 'sitting-room', room: 'Details', label: 'Sitting room', alt: 'Sitting room with rattan mirrors' },
  ] as const
).map((photo, i) => ({ ...photo, image: listingImages[i]! }));

/**
 * The host's picks for the cover grid: the cover shot, then one per room.
 * Not the first five photos, so "the closest tile" isn't the right place to
 * close a photo that isn't on the page.
 */
export const coverPhotoIds = ['pool-terrace', 'living', 'kitchen', 'primary-bedroom', 'soaking-tub'] as const;
