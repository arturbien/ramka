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
