# Shareable albums

A photo journal where every photo in every album has its own link, and all albums share one Root. A link renders the viewer already open from the server, with defaultPayload naming the album no Trigger was tapped for; Back and Forward reopen albums with handle.open.

## Source

```tsx examples/lightbox/shareable-albums/page.tsx
import type { Metadata } from 'next';

import { ShareableAlbumsDemo } from './albums-demo';
import { ALBUMS_PAGE_TITLE, findPhoto } from './albums';

/**
 * `?photo=<id>` links open the viewer on that photo. The page reads the param
 * on the server so the link renders with the viewer already open, and so a
 * shared link unfurls with the photo itself.
 */
interface ShareableAlbumsRouteProps {
  searchParams: Promise<{ photo?: string | string[] }>;
}

async function linkedPhoto({ searchParams }: ShareableAlbumsRouteProps) {
  const { photo } = await searchParams;
  return findPhoto(typeof photo === 'string' ? photo : undefined);
}

export async function generateMetadata(props: ShareableAlbumsRouteProps): Promise<Metadata> {
  const linked = await linkedPhoto(props);
  if (!linked) {
    return {
      title: ALBUMS_PAGE_TITLE,
      description:
        'A photo journal where every photo has a shareable link: one lightbox for every album, server-rendered open from the link with defaultPayload. Built with ramka.',
    };
  }
  const { album, photo } = linked;
  const title = `${photo.caption} · ${album.title} — ${ALBUMS_PAGE_TITLE}`;
  return {
    title,
    description: `${photo.alt}, from ${album.title} by ${album.author.name}.`,
    openGraph: {
      title,
      description: photo.alt,
      images: [{ url: photo.image.src, width: photo.image.width, height: photo.image.height, alt: photo.alt }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function ShareableAlbumsRoute(props: ShareableAlbumsRouteProps) {
  const linked = await linkedPhoto(props);
  return <ShareableAlbumsDemo initialPhotoId={linked?.photo.id ?? null} />;
}
```

```tsx examples/lightbox/shareable-albums/albums-demo.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import * as Lightbox from '@ramka/react/lightbox';
import { useLightboxPayload } from '@ramka/react';
import { Check, Link2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ExampleShell } from '../../../../_components/example-shell';
import {
  LightboxGallery,
  lightboxChromeButton,
  triggerFocusClass,
  type LightboxGalleryItem,
} from '../../../../_components/lightbox-chrome';
import { albums, findPhoto, type Album } from './albums';

const BASE_PATH = '/examples/lightbox/shareable-albums';
const VISIBLE_TILES = 3;
const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';

/** One viewer for every album; each Trigger hands it its album as the payload. */
const viewer = Lightbox.createHandle<Album>();

function photoUrl(photoId: string): string {
  return `${BASE_PATH}?photo=${encodeURIComponent(photoId)}`;
}

function photoIdInUrl(): string | null {
  return new URLSearchParams(window.location.search).get('photo');
}

export function ShareableAlbumsDemo({ initialPhotoId }: { initialPhotoId: string | null }) {
  // The `?photo=` link this page was loaded with, if any, decided once per
  // mount. A link renders the viewer already open, in the server HTML:
  // `defaultOpen` + `defaultValue` pick the photo, and `defaultPayload` hands
  // the viewer its album, since no Trigger was tapped to provide one.
  const [deepLink] = React.useState(() => findPhoto(initialPhotoId) ?? null);

  // What the lightbox shows right now, written from its callbacks. The URL
  // effect below compares against these so it never replays our own writes.
  const openRef = React.useRef(deepLink !== null);
  const photoIdRef = React.useRef(deepLink?.photo.id ?? null);

  // A server-rendered open viewer must not fade in on load; see the
  // URL-synced state example for the full rationale.
  const [ssrNoTransitions, setSsrNoTransitions] = React.useState(deepLink !== null);
  React.useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setSsrNoTransitions(false));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Lightbox → URL. Opening pushes one entry so Back closes the viewer;
  // swiping and closing rewrite it in place. Each write is skipped when the
  // URL already says it, which is the case when the URL drove the change.
  const handleValueChange = (photoId: string) => {
    photoIdRef.current = photoId;
    if (openRef.current && photoIdInUrl() !== photoId) {
      window.history.replaceState(null, '', photoUrl(photoId));
    }
  };
  const handleOpenChange = (open: boolean) => {
    openRef.current = open;
    const photoId = photoIdRef.current;
    if (open && photoId && photoIdInUrl() !== photoId) {
      window.history.pushState(null, '', photoUrl(photoId));
    } else if (!open && photoIdInUrl() !== null) {
      window.history.replaceState(null, '', BASE_PATH);
    }
  };

  // URL → lightbox, for Back and Forward. The Root is uncontrolled, so the
  // handle does the work, and `open` takes the album as its payload: there's
  // no `payload` prop to control, the album travels with the open. Handle
  // calls belong in event handlers, so this listens to `popstate` rather
  // than reacting to the URL in an effect.
  React.useEffect(() => {
    const onPopState = () => {
      const target = findPhoto(photoIdInUrl());
      if (!target) {
        if (openRef.current) viewer.close();
        return;
      }
      const current = findPhoto(photoIdRef.current);
      if (!openRef.current || current?.album !== target.album) {
        viewer.open(target.photo.id, { payload: target.album });
      } else if (current.photo !== target.photo) {
        viewer.goTo(target.photo.id);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <ExampleShell
      title="Shareable albums"
      description={
        <>
          A photo journal where every photo in every album has its own link, and all albums share one{' '}
          <code className={code}>Lightbox.Root</code>. Open a photo, then copy its link or reload: the page comes back
          with the viewer already open on that photo, straight from the server HTML. No Trigger was tapped to say which
          album to show, so the page passes it as <code className={code}>defaultPayload</code>, next to{' '}
          <code className={code}>defaultOpen</code> and <code className={code}>defaultValue</code>. Back and Forward
          reopen other albums with <code className={code}>handle.open(photoId, {'{ payload }'})</code>.
        </>
      }
      docsHref="/docs/lightbox/state-lifecycle"
      docsLabel="State & lifecycle docs"
    >
      <Lightbox.Root
        handle={viewer}
        defaultOpen={deepLink !== null}
        defaultValue={deepLink?.photo.id}
        defaultPayload={deepLink?.album}
        // Items register in effects, which don't run on the server; this lets
        // the server paint the right counter and slide for a link.
        itemIds={deepLink?.album.photos.map((photo) => photo.id)}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        // Photos behind "+N" have no tile, and they come right after the
        // visible ones, so the closest tile is the "+N" one.
        morphTo="closest"
        // Keep the tile the close will land on in view behind the solid
        // backdrop, so the morph never ends on a tile scrolled away. A link
        // opens with no open transition and the page at the top, so only
        // `onClose` brings its album's tile into view.
        scrollTriggerIntoView={[
          { type: 'onChange', behavior: 'instant' },
          { type: 'onOpenComplete', behavior: 'instant' },
          { type: 'onClose', behavior: 'instant' },
        ]}
      >
        <div className="flex max-w-2xl flex-col gap-10">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
        <AlbumViewer
          deepLinked={deepLink !== null}
          initialCaption={deepLink?.photo.caption}
          ssrNoTransitions={ssrNoTransitions}
        />
      </Lightbox.Root>
    </ExampleShell>
  );
}

const noAlbumItems: LightboxGalleryItem[] = [];

function AlbumViewer({
  deepLinked,
  initialCaption,
  ssrNoTransitions,
}: {
  deepLinked: boolean;
  initialCaption: string | undefined;
  ssrNoTransitions: boolean;
}) {
  const album = useLightboxPayload<Album>();
  const items = React.useMemo<LightboxGalleryItem[]>(
    () =>
      album?.photos.map((photo, i) => ({
        id: photo.id,
        src: photo.image,
        thumb: photo.image,
        alt: photo.alt,
        caption: photo.caption,
        // No tile to bridge the morph from (behind "+N"), or a link loading
        // cold: blur up instead.
        destinationBlur: deepLinked || i >= VISIBLE_TILES,
      })) ?? noAlbumItems,
    [album, deepLinked],
  );
  return (
    <LightboxGallery
      items={items}
      ariaLabel={album ? `${album.title} by ${album.author.name}` : 'Album photos'}
      backdrop="solid"
      overlay={album ? <AlbumBadge album={album} /> : null}
      // Server paint of a link: the right slide and caption before hydration.
      ssrSlideShift
      captionFallback={initialCaption}
      // A portal can't be server-rendered, so a link renders the viewer in place.
      portalProps={
        deepLinked
          ? {
              container: null,
              className: `relative z-50${ssrNoTransitions ? ' lightbox-demo-ssr-no-transitions' : ''}`,
            }
          : undefined
      }
    />
  );
}

/** Top-left of the viewer: whose album this is, and a link to the photo. */
function AlbumBadge({ album }: { album: Album }) {
  const [copied, setCopied] = React.useState(false);
  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
  };
  return (
    <div className="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute start-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex items-center gap-2.5">
      <AuthorAvatar album={album} />
      <div className="leading-tight">
        <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">{album.title}</div>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{album.author.name}</div>
      </div>
      <button type="button" onClick={copyLink} className={lightboxChromeButton} aria-label="Copy link to photo">
        {copied ? (
          <Check aria-hidden className="size-4" strokeWidth={2.25} />
        ) : (
          <Link2 aria-hidden className="size-4" strokeWidth={2.25} />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  );
}

function AuthorAvatar({ album }: { album: Album }) {
  return (
    <Avatar aria-hidden>
      <AvatarFallback className={`text-xs font-semibold ${album.author.colorClass}`}>
        {album.author.initials}
      </AvatarFallback>
    </Avatar>
  );
}

const tileCorners = ['rounded-l-xl', 'rounded-tr-xl', 'rounded-br-xl'];

const AlbumCard = React.memo(function AlbumCard({ album }: { album: Album }) {
  const tiles = album.photos.slice(0, VISIBLE_TILES);
  const hiddenCount = album.photos.length - tiles.length;
  return (
    <article>
      <header className="mb-3 flex items-center gap-3">
        <AuthorAvatar album={album} />
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{album.title}</div>
          <div className="text-xs text-neutral-500">
            {album.author.name} · {album.location} · {album.posted}
          </div>
        </div>
      </header>
      <div className="grid h-64 grid-cols-3 grid-rows-2 gap-1 sm:h-80">
        {tiles.map((photo, i) => {
          const overflow = i === VISIBLE_TILES - 1 && hiddenCount > 0;
          return (
            <Lightbox.Trigger
              key={photo.id}
              itemId={photo.id}
              payload={album}
              // The "+N" overlay dissolves into the photo instead of popping.
              crossfade={overflow ? 'both' : undefined}
              aria-label={overflow ? `Open ${photo.caption}, ${hiddenCount} more` : `Open ${photo.caption}`}
              // Breathing room for scrollTriggerIntoView: `block: 'nearest'`
              // would otherwise leave the tile flush with the viewport edge.
              className={`relative block scroll-my-12 cursor-pointer overflow-hidden border-none bg-neutral-200 p-0 dark:bg-neutral-800 ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              } ${tileCorners[i]} ${triggerFocusClass}`}
            >
              {({ imageRef }) => (
                <>
                  <Image
                    ref={imageRef}
                    src={photo.image}
                    alt=""
                    placeholder="blur"
                    sizes={i === 0 ? '(min-width: 672px) 448px, 66vw' : '(min-width: 672px) 224px, 33vw'}
                    className={`block size-full object-cover ${tileCorners[i]}`}
                  />
                  {overflow ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-semibold text-white">
                      +{hiddenCount}
                    </span>
                  ) : null}
                </>
              )}
            </Lightbox.Trigger>
          );
        })}
      </div>
    </article>
  );
});
```

```ts examples/lightbox/shareable-albums/albums.ts
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
```
