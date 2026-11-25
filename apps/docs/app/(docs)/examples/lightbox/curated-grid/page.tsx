'use client';

import Image from 'next/image';
import * as Lightbox from '@ramka/react/lightbox';
import { Bath, BedDouble, Grip, MapPin, Star, Users, Waves, Wifi, type LucideIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExampleShell } from '../../../../_components/example-shell';
import { LightboxGallery, triggerFocusClass, type LightboxGalleryItem } from '../../../../_components/lightbox-chrome';
import { hostAvatar } from './images.generated';
import { coverPhotoIds, listingPhotos, type ListingPhoto } from './listing-data';

const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';

const tour = Lightbox.createHandle();

const coverIds = new Set<string>(coverPhotoIds);
const coverPhotos = coverPhotoIds.map((id) => listingPhotos.find((photo) => photo.id === id)!);
/** Photos with no tile on the page: the last tile stands in for them. */
const offPagePhotoIds = listingPhotos.filter((photo) => !coverIds.has(photo.id)).map((photo) => photo.id);

const galleryItems: LightboxGalleryItem[] = listingPhotos.map((photo) => ({
  id: photo.id,
  src: photo.image,
  thumb: photo.image,
  alt: photo.alt,
  caption: `${photo.room} · ${photo.label}`,
  // No tile on the page to bridge the morph from, so blur up instead.
  destinationBlur: !coverIds.has(photo.id),
}));

/**
 * Cover grid corners: on mobile the cover spans the top row over a 2×2 grid;
 * from `md` it's the tall left column of a 3-column grid. The radius goes on
 * the Trigger as well as the image, since the morph reads it from the Trigger.
 */
const tileCorners = [
  'rounded-t-xl md:rounded-tr-none md:rounded-l-xl',
  '',
  'md:rounded-tr-xl',
  'rounded-bl-xl md:rounded-bl-none',
  'rounded-br-xl',
];

export default function CuratedGridPage() {
  return (
    <ExampleShell
      title="Curated grid"
      description={
        <>
          A vacation-rental listing whose cover grid shows the host&apos;s five picks out of a 21-photo tour: the cover
          shot, then one photo per room. Every photo opens in the viewer, but most have no tile on the page.{' '}
          <code className={code}>morphTo=&quot;closest&quot;</code> would close those onto the nearest tile by position,
          which shows a different photo: the double-height lounge would shrink into the living-room tile. Instead, the
          last tile lists them in <code className={code}>overflowItemIds</code>, so they all close onto it with a
          crossfade, while the five cover photos still morph back to their own tiles.
        </>
      }
      docsHref="/docs/lightbox/view-transitions"
      docsLabel="View transitions docs"
    >
      <Lightbox.Root handle={tour} loop>
        <div className="max-w-4xl pb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Casa Alba, a whitewashed villa above the bay
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1 font-medium text-neutral-900 dark:text-neutral-100">
                <Star aria-hidden className="size-3.5 fill-current" /> 4.96
              </span>
              <span className="underline underline-offset-2">128 reviews</span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3.5" /> Marbella, Spain
              </span>
            </div>
          </div>

          <CoverGrid />

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Entire villa hosted by Claire
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                10 guests · 5 bedrooms · 6 beds · 4.5 baths
              </p>
              <Separator className="my-6" />
              <ul className="grid gap-4 text-sm text-neutral-700 sm:grid-cols-2 dark:text-neutral-300">
                <Amenity icon={Waves} label="Heated infinity pool" />
                <Amenity icon={BedDouble} label="Primary suite with sea view" />
                <Amenity icon={Bath} label="Freestanding soaking tub" />
                <Amenity icon={Wifi} label="Fast wifi, 600 Mbps" />
                <Amenity icon={Users} label="Great for families" />
              </ul>
              <Separator className="my-6" />
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                Set on a quiet hillside ten minutes from the old town, Casa Alba opens onto a pool terrace with views
                across the bay. Inside, a double-height lounge, a kitchen built for long dinners, and five bedrooms
                spread over two floors.
              </p>
            </div>

            <aside className="h-fit rounded-xl border border-neutral-200 p-5 shadow-sm dark:border-neutral-800">
              <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                €1,240 <span className="text-sm font-normal text-neutral-500">night</span>
              </div>
              <Button className="mt-4 w-full">Reserve</Button>
              <p className="mt-2 text-center text-xs text-neutral-500">You won&apos;t be charged yet</p>
              <Separator className="my-4" />
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={hostAvatar.src} alt="" />
                  <AvatarFallback>CR</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-neutral-900 dark:text-neutral-50">Claire Rousseau</div>
                  <div className="text-neutral-500">Superhost · 6 years hosting</div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <LightboxGallery items={galleryItems} ariaLabel="Casa Alba photo tour" backdrop="solid" />
      </Lightbox.Root>
    </ExampleShell>
  );
}

function CoverGrid() {
  return (
    <div className="relative grid grid-cols-2 gap-1.5 md:aspect-[2.2/1] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
      {coverPhotos.map((photo, i) => (
        <CoverTile key={photo.id} photo={photo} index={i} last={i === coverPhotos.length - 1} />
      ))}
      <button
        type="button"
        // Starts the tour at the first photo, morphing from the cover tile.
        onClick={() => tour.open(listingPhotos[0]!.id)}
        className="absolute end-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg border border-neutral-900/80 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
      >
        <Grip aria-hidden className="size-4" />
        Show all {listingPhotos.length} photos
      </button>
    </div>
  );
}

function CoverTile({ photo, index, last }: { photo: ListingPhoto; index: number; last: boolean }) {
  const cover = index === 0;
  const corners = tileCorners[index] ?? '';
  return (
    <Lightbox.Trigger
      itemId={photo.id}
      // The last tile also stands in for every photo without a tile: closing on
      // one lands here, crossfading since the tile shows a different photo.
      overflowItemIds={last ? offPagePhotoIds : undefined}
      aria-label={`Open ${photo.label}`}
      className={`group relative block cursor-pointer overflow-hidden border-none bg-neutral-200 p-0 dark:bg-neutral-800 ${
        cover ? 'col-span-2 aspect-[3/2] md:col-span-1 md:row-span-2 md:aspect-auto' : 'aspect-[4/3] md:aspect-auto'
      } ${corners} ${triggerFocusClass}`}
    >
      {({ imageRef }) => (
        <>
          <Image
            ref={imageRef}
            src={photo.image}
            alt={photo.alt}
            placeholder="blur"
            sizes={cover ? '(min-width: 768px) 440px, 100vw' : '(min-width: 768px) 220px, 50vw'}
            priority={cover}
            className={`block size-full object-cover ${corners}`}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
          />
        </>
      )}
    </Lightbox.Trigger>
  );
}

function Amenity({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <Icon aria-hidden className="size-5 shrink-0 text-neutral-500" />
      {label}
    </li>
  );
}
