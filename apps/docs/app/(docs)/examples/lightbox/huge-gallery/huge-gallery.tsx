'use client';

import * as React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useWindowVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import * as Lightbox from '@ramka/react/lightbox';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import {
  lightboxChromeButton,
  lightboxChromeButtonMd,
  triggerFocusClass,
} from '../../../../_components/lightbox-chrome';
import { feedImages } from '../infinite-scroll/images.generated';

/**
 * Huge gallery — 5,000 photos in one lightbox.
 *
 * `Lightbox.VirtualSlides` keeps only the slides around the active one in the
 * DOM; two empty spacers stand in for the rest, so the native scroll-snap
 * track keeps its full length and every snap position. Root's `itemIds` is
 * the whole gallery, which is how a photo whose slide isn't mounted can still
 * be opened, counted and navigated to.
 *
 * The grid is virtualized too, by rows, so only the tiles near the viewport
 * have a Trigger. When the photo being viewed has no mounted tile, `reveal`
 * scrolls its row into view and Ramka waits for that Trigger before the close
 * morph.
 */

interface Photo {
  id: string;
  image: StaticImageData;
  alt: string;
}

const PHOTO_COUNT = 5000;

const photos: Photo[] = Array.from({ length: PHOTO_COUNT }, (_, i) => ({
  id: `photo-${i}`,
  image: feedImages[i % feedImages.length]!,
  alt: `Photo ${i + 1}`,
}));

const photoIds = photos.map((photo) => photo.id);
const photoIndex = new Map(photoIds.map((id, index) => [id, index]));

const handle = Lightbox.createHandle();

const GAP_PX = 2;

// Same breakpoints as Tailwind's `md` and `lg`.
const COLUMN_QUERIES = [
  ['(min-width: 1024px)', 8],
  ['(min-width: 768px)', 5],
] as const;

function getColumns() {
  return COLUMN_QUERIES.find(([query]) => window.matchMedia(query).matches)?.[1] ?? 3;
}

function subscribeColumns(onChange: () => void) {
  const lists = COLUMN_QUERIES.map(([query]) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener('change', onChange));
  return () => lists.forEach((list) => list.removeEventListener('change', onChange));
}

function useColumns() {
  return React.useSyncExternalStore(subscribeColumns, getColumns, () => 3);
}

export function HugeGallery() {
  const virtualizerRef = React.useRef<Virtualizer<Window, Element> | null>(null);
  const columnsRef = React.useRef(3);

  // The close morph needs its tile on screen. When the photo being viewed is
  // in a row the virtualizer has unmounted, bring that row back.
  const reveal = React.useCallback(({ itemId }: { itemId: string }) => {
    const index = photoIndex.get(itemId);
    if (index === undefined) return;
    virtualizerRef.current?.scrollToIndex(Math.floor(index / columnsRef.current), { align: 'center' });
  }, []);

  return (
    <div className="min-h-screen select-none">
      <Lightbox.Root
        handle={handle}
        itemIds={photoIds}
        scrollTriggerIntoView={[
          { type: 'onChange', behavior: 'instant', reveal },
          { type: 'onOpenComplete', behavior: 'instant', reveal },
          { type: 'onClose', behavior: 'instant', reveal },
        ]}
        awaitImageDecode={false}
      >
        <div className="sticky top-14 z-30 flex items-center justify-between border-b border-black/[0.06] bg-background px-4 py-2.5 md:top-0 dark:border-white/[0.08]">
          <div className="flex flex-col">
            <span className="text-[19px] font-bold leading-6 tracking-tight text-neutral-900 dark:text-neutral-50">
              Library
            </span>
            <span className="text-[11px] font-medium leading-4 text-neutral-500 dark:text-neutral-400">
              {PHOTO_COUNT.toLocaleString('en-US')} photos
            </span>
          </div>
          <button
            type="button"
            onClick={() => handle.open('photo-4321')}
            className="rounded-full bg-black/[0.05] px-3 py-1.5 text-[13px] font-medium text-neutral-700 dark:bg-white/[0.09] dark:text-neutral-200"
          >
            Open photo 4,322
          </button>
        </div>

        <PhotoGrid virtualizerRef={virtualizerRef} columnsRef={columnsRef} />

        <Lightbox.Portal>
          <Lightbox.Backdrop className="lightbox-demo-backdrop fixed inset-0 bg-white dark:bg-black" />
          <Lightbox.Content
            aria-label="Library photos"
            className="lightbox-demo-content lightbox-demo-content-solo fixed inset-0 flex flex-col overscroll-contain outline-none"
          >
            <Lightbox.VirtualSlides
              aria-roledescription="carousel"
              aria-label="Full-size photos"
              className="lightbox-demo-slides flex-1 gap-5 [&::-webkit-scrollbar]:hidden md:gap-0"
            >
              {(index, itemId) => {
                const photo = photos[index]!;
                return (
                  <Lightbox.Slide className="lightbox-demo-slide-pad h-full">
                    <Lightbox.Item
                      index={index}
                      itemId={itemId}
                      aria-roledescription="slide"
                      aria-label={`${index + 1} of ${PHOTO_COUNT}`}
                    >
                      <Lightbox.Zoom maxZoom={6}>
                        <Lightbox.Media
                          width={photo.image.width}
                          height={photo.image.height}
                          className="overflow-hidden rounded-none md:rounded-lg"
                        >
                          <Image
                            src={photo.image}
                            alt={photo.alt}
                            sizes="100vw"
                            loading="eager"
                            draggable={false}
                            className="select-none"
                          />
                        </Lightbox.Media>
                      </Lightbox.Zoom>
                    </Lightbox.Item>
                  </Lightbox.Slide>
                );
              }}
            </Lightbox.VirtualSlides>

            <div className="lightbox-demo-chrome-hide absolute start-3 top-1/2 z-30 -translate-y-1/2">
              <Lightbox.Previous className={lightboxChromeButtonMd} aria-label="Previous photo">
                <ChevronLeft aria-hidden className="h-5 w-5" strokeWidth={2.25} />
              </Lightbox.Previous>
            </div>
            <div className="lightbox-demo-chrome-hide absolute end-3 top-1/2 z-30 -translate-y-1/2">
              <Lightbox.Next className={lightboxChromeButtonMd} aria-label="Next photo">
                <ChevronRight aria-hidden className="h-5 w-5" strokeWidth={2.25} />
              </Lightbox.Next>
            </div>

            <div className="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute end-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30">
              <Lightbox.Close className={lightboxChromeButton} aria-label="Close">
                <X aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </Lightbox.Close>
            </div>

            <div className="lightbox-demo-chrome-bottom lightbox-demo-chrome-hide pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <Lightbox.Counter className="text-[11px] leading-tight tabular-nums text-neutral-500 dark:text-neutral-400">
                {({ current, total }) => `${current.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`}
              </Lightbox.Counter>
            </div>
          </Lightbox.Content>
        </Lightbox.Portal>
      </Lightbox.Root>
    </div>
  );
}

// Its own component so scrolling re-renders only the grid, not the Root.
function PhotoGrid({
  virtualizerRef,
  columnsRef,
}: {
  virtualizerRef: React.RefObject<Virtualizer<Window, Element> | null>;
  columnsRef: React.RefObject<number>;
}) {
  const columns = useColumns();
  columnsRef.current = columns;

  const listRef = React.useRef<HTMLDivElement>(null);
  const [layout, setLayout] = React.useState({ width: 0, top: 0 });
  React.useLayoutEffect(() => {
    const list = listRef.current!;
    const update = () => setLayout({ width: list.clientWidth, top: list.getBoundingClientRect().top + window.scrollY });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const rowHeight = layout.width ? (layout.width - GAP_PX * (columns - 1)) / columns + GAP_PX : 160;
  const virtualizer = useWindowVirtualizer({
    count: Math.ceil(PHOTO_COUNT / columns),
    estimateSize: () => rowHeight,
    overscan: 3,
    scrollMargin: layout.top,
  });
  virtualizerRef.current = virtualizer;

  React.useLayoutEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeight]);

  return (
    <div ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          className="absolute inset-x-0 top-0"
          style={{ transform: `translateY(${row.start - layout.top}px)` }}
        >
          <PhotoRow row={row.index} columns={columns} />
        </div>
      ))}
    </div>
  );
}

// Memoized so a scroll frame doesn't re-render rows that were already mounted.
const PhotoRow = React.memo(function PhotoRow({ row, columns }: { row: number; columns: number }) {
  const rowPhotos = photos.slice(row * columns, (row + 1) * columns);
  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {rowPhotos.map((photo) => (
        <Lightbox.Trigger
          key={photo.id}
          itemId={photo.id}
          className={`relative block aspect-square cursor-pointer overflow-hidden bg-transparent p-0 md:scroll-mt-16 ${triggerFocusClass}`}
        >
          {({ imageRef }) => (
            <Image
              ref={imageRef}
              src={photo.image}
              alt={photo.alt}
              sizes="(min-width: 1024px) 12.5vw, (min-width: 768px) 20vw, 33vw"
              loading="lazy"
              className="block size-full object-cover"
            />
          )}
        </Lightbox.Trigger>
      ))}
    </div>
  );
});
