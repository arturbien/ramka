'use client';

import * as React from 'react';
import Image from 'next/image';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import * as Lightbox from '@ramka/react/lightbox';

import { LightboxGallery, triggerFocusClass, type LightboxGalleryItem } from '../../../../_components/lightbox-chrome';
import { conversation, conversationPhotoCount, rowOfImage, type ChatImage, type ChatMessage } from './chat-data';

/**
 * What a Trigger hands the viewer: the photos of the gallery it opens, in the
 * order the viewer should show them. Here that is the full image list (thumb
 * and full-size are the same static import — `next/image` serves a small
 * variant in the feed and a full-width one in the viewer). A real client can
 * just as well pass `{ messageId }` and read its own cache.
 */
interface ViewerPayload {
  images: readonly ChatImage[];
}

/** One handle for the whole app: every photo in the feed opens through it. */
const viewer = Lightbox.createHandle<ViewerPayload>();

const VISIBLE_TILES = 4;

// Stable payload objects, so a trigger re-render never looks like a new gallery.
const messagePayloads = new Map<string, ViewerPayload>(
  conversation.map((message) => [message.id, { images: message.images }]),
);

export function ChatFeed() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const virtualizerRef = React.useRef<Virtualizer<HTMLDivElement, Element> | null>(null);

  // The close morph needs its trigger on screen. When the photo being viewed
  // belongs to a row the virtualizer has unmounted, bring that row back;
  // Ramka waits for its trigger to mount.
  const revealTrigger = React.useCallback(({ itemId }: { itemId: string }) => {
    const row = rowOfImage.get(itemId);
    if (row !== undefined) virtualizerRef.current?.scrollToIndex(row, { align: 'center' });
  }, []);

  return (
    <>
      <div className="mx-auto flex h-[80vh] max-w-xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <ChatHeader />
        <MessageList scrollRef={scrollRef} virtualizerRef={virtualizerRef} />
      </div>

      {/* Mounted once. Renders whichever gallery the opening Trigger's payload names. */}
      <Lightbox.Root
        handle={viewer}
        revealTrigger={revealTrigger}
        scrollTriggerIntoView={[
          { type: 'onChange', behavior: 'instant' },
          { type: 'onOpenComplete', behavior: 'instant' },
        ]}
      >
        {({ payload }) => <ChatViewer images={payload?.images ?? []} />}
      </Lightbox.Root>
    </>
  );
}

function ChatViewer({ images }: { images: readonly ChatImage[] }) {
  const items = React.useMemo<LightboxGalleryItem[]>(
    () =>
      images.map((image) => ({
        id: image.id,
        src: image.src,
        thumb: image.src,
        alt: image.alt,
        // Photos behind "+N" have no thumbnail on the page to bridge the morph
        // with, so they use the destination image's own blur-up instead.
        destinationBlur: image.indexInMessage >= VISIBLE_TILES,
      })),
    [images],
  );
  return <LightboxGallery keyed items={items} ariaLabel="Chat photos" />;
}

function ChatHeader() {
  return (
    <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">Ola</div>
      <div className="text-[11px] text-neutral-500">
        {conversation.length.toLocaleString('en-US')} messages · {conversationPhotoCount.toLocaleString('en-US')} photos
      </div>
    </div>
  );
}

function estimateRowSize(message: ChatMessage): number {
  const text = message.text ? 44 : 0;
  const photos = message.images.length === 0 ? 0 : message.images.length === 1 ? 300 : 248;
  return 8 + text + photos;
}

function MessageList({
  scrollRef,
  virtualizerRef,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  virtualizerRef: React.RefObject<Virtualizer<HTMLDivElement, Element> | null>;
}) {
  const virtualizer = useVirtualizer({
    count: conversation.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimateRowSize(conversation[index]!),
    getItemKey: (index) => conversation[index]!.id,
    overscan: 4,
  });
  virtualizerRef.current = virtualizer;

  // Chats open at the newest message.
  React.useLayoutEffect(() => {
    virtualizer.scrollToIndex(conversation.length - 1, { align: 'end' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = virtualizer.getVirtualItems();

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto overscroll-contain px-3" aria-label="Messages">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {rows.map((row) => {
          const message = conversation[row.index]!;
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <MessageRow message={message} />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none sticky bottom-2 flex justify-center">
        <span className="rounded-full bg-neutral-900/70 px-2.5 py-1 font-mono text-[10px] text-white tabular-nums dark:bg-white/15">
          {rows.length} of {conversation.length} rows mounted
        </span>
      </div>
    </div>
  );
}

const MessageRow = React.memo(function MessageRow({ message }: { message: ChatMessage }) {
  const mine = message.author === 'me';
  return (
    <div className={`flex flex-col gap-1 py-1 ${mine ? 'items-end' : 'items-start'}`}>
      {message.images.length > 0 ? <PhotoGrid message={message} payload={messagePayloads.get(message.id)!} /> : null}
      {message.text ? (
        <div
          className={`max-w-[75%] rounded-[18px] px-3.5 py-2 text-sm leading-snug ${
            mine
              ? 'rounded-br-[4px] bg-blue-500 text-white'
              : 'rounded-bl-[4px] bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
          }`}
          title={message.time}
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
});

function PhotoGrid({ message, payload }: { message: ChatMessage; payload: ViewerPayload }) {
  const { images } = message;
  const tiles = images.slice(0, VISIBLE_TILES);
  const hidden = images.slice(VISIBLE_TILES);
  const count = images.length;

  if (count === 1) {
    const image = images[0]!;
    return (
      <PhotoTrigger
        image={image}
        payload={payload}
        label={`Open ${image.alt}`}
        sizes="240px"
        className="block w-[240px] overflow-hidden rounded-2xl"
        imageClassName="block h-auto w-full"
      />
    );
  }

  const gridClass = count === 2 ? 'grid-cols-2 grid-rows-1 h-[150px]' : 'grid-cols-2 grid-rows-2 h-[240px]';
  return (
    <div className={`grid w-[260px] gap-0.5 overflow-hidden rounded-2xl ${gridClass}`}>
      {tiles.map((image, i) => {
        const overflow = i === VISIBLE_TILES - 1 && hidden.length > 0;
        const tall = count === 3 && i === 0;
        return (
          <PhotoTrigger
            key={image.id}
            image={image}
            payload={payload}
            // The "+N" tile opens its own photo and stands in for the hidden
            // ones: closing on any of them lands back here. Crossfade so the
            // dark overlay dissolves into the photo instead of popping.
            overflowItemIds={overflow ? hidden.map((h) => h.id) : undefined}
            crossfade={overflow ? 'both' : undefined}
            label={overflow ? `Open ${image.alt}, ${hidden.length} more` : `Open ${image.alt}`}
            // Half-width tiles; the tall one is cropped from a full-height image.
            sizes={tall ? '260px' : '130px'}
            className={`relative block size-full overflow-hidden ${tall ? 'row-span-2' : ''}`}
            imageClassName="block size-full object-cover"
          >
            {overflow ? (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-semibold text-white">
                +{hidden.length}
              </span>
            ) : null}
          </PhotoTrigger>
        );
      })}
    </div>
  );
}

function PhotoTrigger({
  image,
  payload,
  overflowItemIds,
  crossfade,
  label,
  sizes,
  className,
  imageClassName,
  children,
}: {
  image: ChatImage;
  payload: ViewerPayload;
  overflowItemIds?: string[];
  crossfade?: 'both';
  label: string;
  sizes: string;
  className: string;
  imageClassName: string;
  children?: React.ReactNode;
}) {
  return (
    <Lightbox.Trigger
      handle={viewer}
      itemId={image.id}
      payload={payload}
      overflowItemIds={overflowItemIds}
      crossfade={crossfade}
      aria-label={label}
      className={`cursor-pointer border-none bg-neutral-200 p-0 dark:bg-neutral-800 ${triggerFocusClass} ${className}`}
    >
      {({ imageRef }) => (
        <>
          <Image
            ref={imageRef}
            src={image.src}
            alt=""
            sizes={sizes}
            // Rows mount as they scroll in; lazy loading would fetch them late.
            loading="eager"
            placeholder="blur"
            draggable={false}
            className={imageClassName}
          />
          {children}
        </>
      )}
    </Lightbox.Trigger>
  );
}
