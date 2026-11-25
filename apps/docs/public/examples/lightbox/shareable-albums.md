# Shareable albums

A photo journal where every photo in every album has its own link, and all albums share one Root. A link renders the viewer already open from the server, with defaultPayload naming the album no Trigger was tapped for; Back and Forward reopen albums with handle.open.

## Source

```tsx examples/lightbox/shareable-albums/page.tsx
import type { Metadata } from 'next';

import { ShareableAlbumsDemo } from './albums-demo';
import { ALBUMS_PAGE_TITLE, findPhoto, photoPageTitle } from './albums';

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
  const title = photoPageTitle(photo.id);
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
import { albums, findPhoto, photoPageTitle, type Album } from './albums';

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

// History writes never re-run the route's metadata, so the tab title would
// stay on the photo the page loaded with. The suffix mirrors the root
// layout's title template, which only applies on the server.
function retitle(photoId: string | null) {
  document.title = `${photoPageTitle(photoId)} — ramka`;
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

  // A server-rendered open viewer must not fade in: the skin's open fades run
  // off @starting-style, which applies on first render, and for server HTML
  // that's page load. While this is on, a host class flattens every
  // transition inside (ssr-no-transitions.css), so the server paint is the
  // final frame. It comes off one frame after the first client paint:
  // dropping it in the same style recalc where the strip's data-positioned
  // lands would start the very fades it suppresses. Double rAF, because the
  // first can fire before the pending paint.
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
    if (!openRef.current) return;
    if (photoIdInUrl() !== photoId) {
      window.history.replaceState(null, '', photoUrl(photoId));
    }
    retitle(photoId);
  };
  const handleOpenChange = (open: boolean) => {
    openRef.current = open;
    const photoId = photoIdRef.current;
    if (open && photoId && photoIdInUrl() !== photoId) {
      window.history.pushState(null, '', photoUrl(photoId));
    } else if (!open && photoIdInUrl() !== null) {
      window.history.replaceState(null, '', BASE_PATH);
    }
    retitle(open ? photoId : null);
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

/** One title for the server metadata and the client's retitling, so they never drift. */
export function photoPageTitle(id: string | null | undefined): string {
  const linked = findPhoto(id);
  return linked ? `${linked.photo.caption} · ${linked.album.title} — ${ALBUMS_PAGE_TITLE}` : ALBUMS_PAGE_TITLE;
}
```

```css app/lightbox-demo/ssr-no-transitions.css
/*
 * No entrance motion when the page ITSELF is the entrance — used by
 * deep-linked visits that server-render the lightbox already open
 * (the Shareable albums example's `?photo=` links).
 *
 * The skin's open/close fades run off `@starting-style` (open-close.css,
 * chrome-hide, the strip's data-positioned reveal), and @starting-style
 * applies on an element's FIRST render — which, on a server-rendered open
 * viewer, is page load. A refreshed deep link would fade its own content in
 * as if it had just opened. While this class is on the Portal host every
 * transition inside is flattened, so the server paint IS the final frame.
 *
 * The demo removes the class one frame AFTER the first post-hydration paint
 * (not in the hydration commit): transitions consult the after-change style,
 * so dropping it in the same style recalc where e.g. the strip's
 * `data-positioned` lands would start the very fades being suppressed.
 *
 * (The companion problem — painting the RIGHT slide before hydration — is
 * library-owned: `Lightbox.Slides ssrSlideShift`, plus the skin mirroring the
 * track gap into `--lightbox-ssr-slide-gap` in lightbox-chrome.tsx. This file
 * is only about suppressing the skin's own fades.)
 */
.lightbox-demo-ssr-no-transitions *,
.lightbox-demo-ssr-no-transitions *::before,
.lightbox-demo-ssr-no-transitions *::after {
  transition: none !important;
}
```

```css app/lightbox-demo/thumbnail-strip-scroll-link.css
/**
 * Docs-only thumbnail-strip cosmetics (default gallery chrome).
 *
 * Library ThumbnailStrip owns midline padding, overflow clip, and the
 * ScrollTimeline → track transform link. Selection chrome here is a simple
 * floating square. Aspect-morph nine-slice lives on the debug recipes page.
 */

/*
 * Strip docked inside Slides. Wheel scroll chains through the containing
 * block, so an overlay beside the scroller never scrolls it; a sticky child
 * does, and stays pinned to the scrollport. `order: -1` and the negative end
 * margin give it zero net inline size, so the slides' snap positions and
 * geometry are unchanged (the margin also cancels the track gap after it).
 */
.lightbox-demo-strip-dock {
  box-sizing: border-box;
  order: -1;
  position: sticky;
  inset-inline: 0;
  z-index: 2;
  flex: none;
  align-self: flex-end;
  width: 100cqw;
  margin-inline-end: calc(-100cqw - var(--lightbox-snug-gap, var(--lightbox-ssr-slide-gap, 0px)));
  padding-inline: 0.75rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  pointer-events: none;
}

/* Zoomed media paints above the fading strip (see pull-progress.css). */
.lightbox-demo-content[data-zoomed] .lightbox-demo-strip-dock {
  z-index: 0;
}

.lightbox-demo-thumbnail-strip {
  --lightbox-demo-thumb-h: 4.5rem;
  --lightbox-demo-thumbnail-strip-fade: 40px;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  /* Fits the floating indicator's overhang (3px gap + 2px stroke). */
  padding-block: 0.3125rem;
  /*
   * Soft clip on both edges. Stops at 25/50/75% of the fade use smoothstep
   * alphas (t²(3−2t)) so the dissolve eases in/out instead of a hard ramp.
   */
  -webkit-mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.75),
    #000 var(--lightbox-demo-thumbnail-strip-fade),
    #000 calc(100% - var(--lightbox-demo-thumbnail-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
  mask-image: linear-gradient(
    to right,
    rgb(0 0 0 / 0) 0,
    rgb(0 0 0 / 0.156) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.25),
    rgb(0 0 0 / 0.5) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.5),
    rgb(0 0 0 / 0.844) calc(var(--lightbox-demo-thumbnail-strip-fade) * 0.75),
    #000 var(--lightbox-demo-thumbnail-strip-fade),
    #000 calc(100% - var(--lightbox-demo-thumbnail-strip-fade)),
    rgb(0 0 0 / 0.844) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.75),
    rgb(0 0 0 / 0.5) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.5),
    rgb(0 0 0 / 0.156) calc(100% - var(--lightbox-demo-thumbnail-strip-fade) * 0.25),
    rgb(0 0 0 / 0) 100%
  );
}

/*
 * Hidden until the library has positioned the track against the Slides
 * scroller (`data-positioned`, set in a layout effect before first client
 * paint). Client-side opens carry the attribute on their first painted frame,
 * so this never hides anything there. It only matters for pages that
 * server-render an open lightbox (Shareable albums deep links): scroll/transform
 * positions cannot be serialized into HTML, so the SSR'd strip sits at offset
 * 0 until hydration — a strip pointing at the wrong photo reads as broken,
 * a strip fading in a beat late reads as loading.
 */
.lightbox-demo-thumbnail-strip:not([data-positioned]) {
  opacity: 0;
}

.lightbox-demo-thumbnail-strip[data-positioned] {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

.lightbox-demo-thumbnail-strip [data-ramka-thumbnail-strip-track] {
  display: flex;
  width: max-content;
  gap: 0.625rem;
  align-items: center;
}

.lightbox-demo-thumbnail-strip [role='tab'] {
  box-sizing: border-box;
  position: relative;
  display: block;
  width: var(--lightbox-demo-thumb-h);
  height: var(--lightbox-demo-thumb-h);
  flex-shrink: 0;
  overflow: hidden;
  margin: 0;
  border: 0;
  border-radius: 0.5rem;
  padding: 0;
  appearance: none;
  background: transparent;
}

.lightbox-demo-thumbnail-strip [role='tab'] img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* Stationary midline square — same size as a thumb + 3px gap + 2px stroke. */
.lightbox-demo-thumbnail-strip-indicator {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  width: calc(var(--lightbox-demo-thumb-h) + 10px);
  height: calc(var(--lightbox-demo-thumb-h) + 10px);
  border-radius: calc(0.5rem + 3px);
  border: 2px solid #000;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

:is(.dark, [data-theme='dark']) .lightbox-demo-thumbnail-strip-indicator {
  border-color: #fff;
}
```
