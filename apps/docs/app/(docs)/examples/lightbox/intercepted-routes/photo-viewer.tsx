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
