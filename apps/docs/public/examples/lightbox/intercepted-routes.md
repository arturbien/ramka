# Intercepted routes

The nextgram pattern with a morph: tiles are Triggers rendered as Links, so a click morphs the viewer open and soft-navigates to the intercepted (.)photos/[id] route in a @modal slot — Back and Forward close and reopen it, hard loads get a standalone photo page (one URL, two presentations).

## Source

```tsx examples/lightbox/intercepted-routes/page.tsx
import type { Metadata } from 'next';

import { ExampleShell } from '../../../../_components/example-shell';
import { PhotoTile } from './photo-viewer';
import { EXAMPLE_PAGE_TITLE, interceptedPhotos } from './photos';

export const metadata: Metadata = {
  title: EXAMPLE_PAGE_TITLE,
  description:
    'A photo grid wired to Next.js intercepted + parallel routes: clicking a tile morphs the lightbox open and soft-navigates to the photo URL; loading that URL cold renders a standalone photo page instead. Built with ramka.',
};

/**
 * Each tile is a `Lightbox.Trigger` rendered as a `<Link>` (see PhotoTile): the
 * click opens the viewer through the gesture path, so it morphs from the tile,
 * and the same click navigates to the photo URL, which Next.js intercepts
 * (`@modal/(.)photos/[id]`) while this page stays on screen. A refresh on a
 * photo URL still renders a different presentation (the standalone page);
 * the Shareable albums example keeps the viewer open on refresh instead.
 *
 * `scroll={false}` on the Links keeps the grid's scroll position — without
 * it, Next scrolls the page to the top on every navigation.
 */
export default function InterceptedRoutesGridPage() {
  return (
    <ExampleShell
      title="Intercepted routes"
      description="The nextgram pattern with a morph: a @modal parallel-route slot and an (.)photos/[id] intercepting route, with one controlled lightbox in the layout. Every tile is a Lightbox.Trigger rendered as a Next.js Link, so a click morphs the viewer open from the tile and soft-navigates to the photo URL in one go. Swiping rewrites the URL in place, closing morphs back onto the tile and pops the entry, and browser Back and Forward close and reopen the viewer. Hard-loading a photo URL skips interception entirely and renders a standalone photo page: one URL, two presentations."
      docsHref="/docs/lightbox/state-lifecycle"
      docsLabel="State & lifecycle docs"
    >
      <div className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {interceptedPhotos.map((photo) => (
          <PhotoTile key={photo.id} photo={photo} />
        ))}
      </div>
    </ExampleShell>
  );
}
```

```tsx examples/lightbox/intercepted-routes/layout.tsx
import { InterceptedViewer } from './photo-viewer';

/**
 * The layout is what makes the parallel-route slot exist: `@modal` renders as
 * the `modal` prop NEXT TO the page, not inside it. During soft navigation to
 * `photos/[id]` the interception route fills this slot while `children` keeps
 * showing the grid the user was on; on hard loads the slot renders
 * `@modal/default.tsx` (null) and `children` is the standalone photo page.
 *
 * The viewer lives here, around both slots, so the grid's tiles can be its
 * Triggers and the close can morph back onto them. The slot only tells it
 * which photo the URL shows.
 */
export default function InterceptedRoutesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <InterceptedViewer>
      {children}
      {modal}
    </InterceptedViewer>
  );
}
```

```tsx examples/lightbox/intercepted-routes/photo-viewer.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Lightbox from '@ramka/react/lightbox';

import { LightboxGallery, triggerFocusClass } from '../../../../_components/lightbox-chrome';
import {
  EXAMPLE_BASE_PATH,
  EXAMPLE_PAGE_TITLE,
  interceptedPhotos,
  interceptedPhotoTitle,
  type InterceptedPhoto,
} from './photos';

const items = interceptedPhotos.map((photo) => ({ ...photo, src: photo.image, thumb: photo.image }));
const photoIds = interceptedPhotos.map((photo) => photo.id);

function photoUrl(photoId: string) {
  return `${EXAMPLE_BASE_PATH}/photos/${photoId}`;
}

function onPhotoUrl() {
  return window.location.pathname.startsWith(`${EXAMPLE_BASE_PATH}/photos/`);
}

// History writes never re-run route metadata, so the tab title would stay on
// the photo the viewer opened with. The suffix mirrors the root layout's
// title template, which only applies on the server.
function retitle(photoId: string | null) {
  const photo = photoId ? interceptedPhotos.find((p) => p.id === photoId) : undefined;
  document.title = `${photo ? interceptedPhotoTitle(photo) : EXAMPLE_PAGE_TITLE} — ramka`;
}

interface PhotoRouteSync {
  /** The URL now shows this photo (the intercepted route mounted). */
  show: (photoId: string) => void;
  /** The URL left the photo (the intercepted route unmounted). */
  hide: () => void;
}

const PhotoRouteSyncContext = React.createContext<PhotoRouteSync | null>(null);

/**
 * One Root for the whole example, mounted by the layout around both slots, so
 * the grid's tiles are real Triggers of the viewer. A tile click opens the
 * viewer itself (with the morph) and, being a Link, also soft-navigates to the
 * photo URL. The intercepted route then finds the viewer already open on its
 * photo; it only has to open it when the URL got there some other way
 * (Forward), and close it when the URL leaves (Back).
 *
 * Controlled, because the route drives it from effects: a controlled `open`
 * is plain state, while handle calls belong in event handlers.
 */
export function InterceptedViewer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [photoId, setPhotoId] = React.useState<string | null>(null);
  // What the viewer shows right now, for callbacks that run before a render.
  const openRef = React.useRef(false);

  const sync = React.useMemo<PhotoRouteSync>(
    () => ({
      show(id) {
        setPhotoId(id);
        if (openRef.current) return;
        openRef.current = true;
        setOpen(true);
      },
      hide() {
        if (!openRef.current) return;
        openRef.current = false;
        setOpen(false);
        retitle(null);
      },
    }),
    [],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    openRef.current = nextOpen;
    setOpen(nextOpen);
    if (!nextOpen) retitle(null);
  };

  // A tile click reports its photo before the open, and its Link pushes the
  // URL. Swipes while open replace the URL in place, so one Back always
  // closes the viewer.
  const handleValueChange = (nextPhotoId: string) => {
    setPhotoId(nextPhotoId);
    if (!openRef.current) return;
    if (onPhotoUrl()) window.history.replaceState(null, '', photoUrl(nextPhotoId));
    retitle(nextPhotoId);
  };

  // A gesture close (Escape, ✕, pull) pops the entry the Link pushed, once the
  // close has landed: popping mid-morph would run Next's navigation between
  // the transition's snapshots. After Back the URL already left the photo.
  const handleOpenChangeComplete = (nextOpen: boolean) => {
    if (!nextOpen && onPhotoUrl()) router.back();
  };

  return (
    <PhotoRouteSyncContext.Provider value={sync}>
      <Lightbox.Root
        open={open}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        value={photoId ?? undefined}
        onValueChange={handleValueChange}
        // Route opens (Forward) happen before the items register.
        itemIds={photoIds}
        loop
        scrollTriggerIntoView={[
          { type: 'onChange', behavior: 'instant' },
          { type: 'onOpenComplete', behavior: 'instant' },
        ]}
      >
        {children}
        <LightboxGallery
          items={items}
          ariaLabel="Gallery photos"
          backdrop="solid"
          captionFallback={interceptedPhotos.find((p) => p.id === photoId)?.caption}
        />
      </Lightbox.Root>
    </PhotoRouteSyncContext.Provider>
  );
}

/**
 * Rendered by the intercepting route: keeps the viewer in step with the URL.
 * Closing is keyed to the URL rather than to unmounting alone, so Strict
 * Mode's rehearsal unmount (URL unchanged) doesn't close a viewer that's open.
 */
export function PhotoRoute({ photoId }: { photoId: string }) {
  const sync = React.useContext(PhotoRouteSyncContext);
  React.useEffect(() => {
    sync?.show(photoId);
    return () => {
      if (!onPhotoUrl()) sync?.hide();
    };
  }, [sync, photoId]);
  return null;
}

/**
 * A grid tile: a Trigger rendered as the photo's Link. A plain click opens the
 * viewer and navigates; a modified click (new tab, new window) is left to the
 * browser alone.
 */
export function PhotoTile({ photo }: { photo: InterceptedPhoto }) {
  return (
    <Lightbox.Trigger
      itemId={photo.id}
      render={<Link href={photoUrl(photo.id)} scroll={false} />}
      onClickCapture={(event: React.MouseEvent) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          event.stopPropagation();
        }
      }}
      // Breathing room for scrollTriggerIntoView: `block: 'nearest'` would
      // otherwise leave the tile flush with the viewport edge.
      className={`block scroll-my-12 overflow-hidden rounded-xl ${triggerFocusClass}`}
    >
      {({ imageRef }) => (
        <Image
          ref={imageRef}
          src={photo.image}
          alt={photo.alt}
          placeholder="blur"
          sizes="(min-width: 640px) 224px, 50vw"
          className="block aspect-square h-auto w-full rounded-xl bg-neutral-100 object-cover transition duration-200 hover:opacity-90 dark:bg-neutral-800"
        />
      )}
    </Lightbox.Trigger>
  );
}
```

```ts examples/lightbox/intercepted-routes/photos.ts
import type { StaticImageData } from 'next/image';

// Static imports (not the download-images generator) — the photos are
// listed in scripts/download-images.mjs with no generated module.
import p1 from '../../../../_assets/photos/mb-01.jpg';
import p2 from '../../../../_assets/photos/mb-02.jpg';
import p4 from '../../../../_assets/photos/mb-04.jpg';
import p5 from '../../../../_assets/photos/mb-05.jpg';
import p7 from '../../../../_assets/photos/mb-07.jpg';
import p8 from '../../../../_assets/photos/mb-08.jpg';
import p10 from '../../../../_assets/photos/mb-10.jpg';
import p11 from '../../../../_assets/photos/mb-11.jpg';

/**
 * Shared photo catalogue for the intercepted-routes example. One list serves
 * the grid page, the intercepted modal route, and the standalone photo page
 * (`photos/[id]/page.tsx`), so a photo's URL can never drift from its slide.
 */
export interface InterceptedPhoto {
  /**
   * URL segment for the photo route (`…/intercepted-routes/photos/5`). A
   * stable id looked up by value — never by array position — so reordering
   * or removing photos can't repoint existing links.
   */
  id: string;
  alt: string;
  caption: string;
  image: StaticImageData;
}

export const EXAMPLE_BASE_PATH = '/examples/lightbox/intercepted-routes';

export const EXAMPLE_PAGE_TITLE = 'Intercepted routes example';

export function interceptedPhotoTitle(photo: InterceptedPhoto): string {
  return `${photo.caption} — ${EXAMPLE_PAGE_TITLE}`;
}

export const interceptedPhotos: InterceptedPhoto[] = (
  [
    { id: '1', alt: 'Foggy pine ridge at dawn', caption: 'Dawn ridge' },
    { id: '2', alt: 'Empty coastal highway', caption: 'Open road' },
    { id: '3', alt: 'Narrow sunlit alley', caption: 'Warm alley' },
    { id: '4', alt: 'Wide desert dunes', caption: 'Dunes' },
    { id: '5', alt: 'Calm lake reflection', caption: 'Still water' },
    { id: '6', alt: 'Tall concrete staircase', caption: 'Ascent' },
    { id: '7', alt: 'Panoramic city skyline at dusk', caption: 'Dusk skyline' },
    { id: '8', alt: 'Single tree in a green field', caption: 'Lone tree' },
  ] as const
).map((photo, i) => ({ ...photo, image: [p1, p2, p4, p5, p7, p8, p10, p11][i]! }));
```

```tsx examples/lightbox/intercepted-routes/@modal/default.tsx
/**
 * Required for every parallel-route slot: rendered whenever the current URL
 * has no match inside `@modal` — the grid page, the standalone photo page on
 * a hard load, and any unmatched sibling route. Without it those URLs 404.
 */
export default function ModalDefault() {
  return null;
}
```

```tsx examples/lightbox/intercepted-routes/@modal/(.)photos/[id]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PhotoRoute } from '../../../photo-viewer';
import { interceptedPhotos, interceptedPhotoTitle } from '../../../photos';

interface InterceptedPhotoRouteProps {
  params: Promise<{ id: string }>;
}

// The intercepted navigation resolves metadata from this route, not the grid
// underneath; without a title here the tab falls back to the site default.
export async function generateMetadata({ params }: InterceptedPhotoRouteProps): Promise<Metadata> {
  const { id } = await params;
  const photo = interceptedPhotos.find((p) => p.id === id);
  return photo ? { title: interceptedPhotoTitle(photo) } : {};
}

/**
 * The intercepting route: `(.)` matches `photos/[id]` at the same segment
 * level, so a soft navigation from the grid renders THIS page into the
 * layout's `@modal` slot instead of navigating to the standalone photo page —
 * the grid stays mounted underneath. Hard loads never come here (interception
 * is client-navigation-only); they get `photos/[id]/page.tsx`.
 *
 * It renders nothing: the viewer lives in the layout, and this only keeps it
 * on the photo the URL names.
 */
export default async function InterceptedPhotoRoute({ params }: InterceptedPhotoRouteProps) {
  const { id } = await params;
  if (!interceptedPhotos.some((photo) => photo.id === id)) notFound();
  return <PhotoRoute photoId={id} />;
}
```

```tsx examples/lightbox/intercepted-routes/photos/[id]/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EXAMPLE_BASE_PATH, interceptedPhotos, interceptedPhotoTitle } from '../../photos';

/**
 * The hard-load presentation. Interception is a client-side navigation concept
 * only: a refresh, bookmark, or shared link of `…/photos/5` never touches
 * `@modal/(.)photos/[id]` — Next.js serves THIS standalone page instead
 * (Instagram's dedicated photo page is the same move). That is the pattern's
 * defining tradeoff: one URL, two presentations. If the refresh should keep
 * the grid + open-viewer presentation instead, that's the Shareable albums
 * example (container={null} + ssrSlideShift).
 */
interface PhotoPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return interceptedPhotos.map((photo) => ({ id: photo.id }));
}

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = interceptedPhotos.find((p) => p.id === id);
  if (!photo) return {};
  return {
    title: interceptedPhotoTitle(photo),
    description: `${photo.alt} — the standalone hard-load presentation of an intercepted photo route.`,
    openGraph: {
      title: interceptedPhotoTitle(photo),
      description: photo.alt,
      images: [
        {
          url: photo.image.src,
          width: photo.image.width,
          height: photo.image.height,
          alt: photo.alt,
        },
      ],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function StandalonePhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = interceptedPhotos.find((p) => p.id === id);
  if (!photo) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14 md:px-10 md:py-16">
      <Link
        href={EXAMPLE_BASE_PATH}
        className="mb-8 inline-block text-[13px] text-neutral-500 underline underline-offset-4 hover:text-neutral-800 dark:hover:text-neutral-200"
      >
        ← Back to the gallery
      </Link>
      <figure>
        <Image
          src={photo.image}
          alt={photo.alt}
          placeholder="blur"
          sizes="(min-width: 896px) 832px, 100vw"
          priority
          className="block h-auto w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800"
        />
        <figcaption className="mt-4 text-[15px] text-neutral-600 dark:text-neutral-300">{photo.caption}</figcaption>
      </figure>
      <p className="mt-8 max-w-2xl text-[13px] leading-6 text-neutral-500">
        You hard-loaded this photo URL, so route interception did not apply and you got this standalone page instead of
        the lightbox over the grid — one URL, two presentations. Navigate back to the gallery and click the same photo
        to see the intercepted modal presentation.
      </p>
    </div>
  );
}
```
