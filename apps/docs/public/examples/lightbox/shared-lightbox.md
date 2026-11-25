# Shared lightbox

One lightbox, many galleries: a 1,000-message chat with a single Root, where each trigger carries its message as a payload. The feed is virtualized, so triggers mount and unmount as you scroll; revealTrigger brings a row back for the close morph, and "+N" grids close onto their tile.

## Source

```tsx examples/lightbox/shared-lightbox/page.tsx
'use client';

import { ExampleShell } from '../../../../_components/example-shell';
import { ChatFeed } from './chat-feed';

const code = 'rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800';

export default function SharedLightboxPage() {
  return (
    <ExampleShell
      title="Shared lightbox"
      description={
        <>
          One lightbox, many galleries: a group chat with a thousand messages and a single{' '}
          <code className={code}>Lightbox.Root</code>. Every photo&apos;s <code className={code}>Lightbox.Trigger</code>{' '}
          carries its message as a <code className={code}>payload</code>, and the viewer reads it with{' '}
          <code className={code}>useLightboxPayload()</code>, so opening, swiping and closing never re-render the feed.
          The feed is virtualized, so only the rows on screen exist, along with their Triggers. If the photo you close
          on belongs to an unmounted row, <code className={code}>revealTrigger</code> scrolls it back so the close morph
          has a tile to land on. With <code className={code}>morphTo=&quot;closest&quot;</code>, closing on a photo
          behind &ldquo;+N&rdquo; lands on the &ldquo;+N&rdquo; tile.
        </>
      }
    >
      <ChatFeed />
    </ExampleShell>
  );
}
```

```tsx examples/lightbox/shared-lightbox/chat-feed.tsx
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual';
import * as Lightbox from '@ramka/react/lightbox';
import { useLightboxPayload } from '@ramka/react';

import { Avatar, AvatarFallback, AvatarGroup } from '@/components/ui/avatar';

import { LightboxGallery, triggerFocusClass, type LightboxGalleryItem } from '../../../../_components/lightbox-chrome';
import {
  conversation,
  conversationPhotoCount,
  me,
  participantById,
  participants,
  rowOfImage,
  type ChatImage,
  type ChatMessage,
  type ChatParticipant,
} from './chat-data';

/**
 * What a Trigger hands the viewer: the photos of the gallery it opens, in the
 * order the viewer should show them. Here that is the full image list (thumb
 * and full-size are the same static import — `next/image` serves a small
 * variant in the feed and a full-width one in the viewer). A real client can
 * just as well pass `{ messageId }` and read its own cache.
 */
interface ViewerPayload {
  images: readonly ChatImage[];
  /** Who sent the message, shown in the viewer's top-left corner. */
  sender: ChatParticipant;
  sentAt: string;
}

const VISIBLE_TILES = 4;

// Stable payload objects, so a trigger re-render never looks like a new gallery.
const messagePayloads = new Map<string, ViewerPayload>(
  conversation.map((message) => [
    message.id,
    { images: message.images, sender: participantById.get(message.author) ?? me, sentAt: formatTime(message.time) },
  ]),
);

function formatTime(time: string): string {
  // Fixed zone, so the server and client render the same string.
  return new Date(`${time.replace(' ', 'T')}Z`).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

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

  // One Root for the whole chat. Opening, swiping and closing never re-render
  // the feed: its elements are created here, not by the Root, and the rows
  // don't read lightbox state. Only the open message's Triggers and the viewer
  // (which reads the payload) update.
  return (
    <Lightbox.Root
      // Photos behind "+N" have no tile; closing on one lands on the closest
      // tile before it, the "+N" one.
      morphTo="closest"
      revealTrigger={revealTrigger}
      scrollTriggerIntoView={[
        { type: 'onChange', behavior: 'instant' },
        { type: 'onOpenComplete', behavior: 'instant' },
      ]}
    >
      <div className="mx-auto flex h-[80vh] max-w-xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <ChatHeader />
        <MessageList scrollRef={scrollRef} virtualizerRef={virtualizerRef} />
      </div>
      <ChatViewer />
    </Lightbox.Root>
  );
}

const noImages: readonly ChatImage[] = [];

/** Renders whichever message's photos the opening Trigger's payload carries. */
function ChatViewer() {
  // Re-renders only when an open brings a new payload. Keep lightbox hooks in
  // the viewer: one in a feed row would re-render every row.
  const payload = useLightboxPayload<ViewerPayload>();
  const images = payload?.images ?? noImages;
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
  return (
    <LightboxGallery
      items={items}
      ariaLabel={payload ? `Photos from ${payload.sender.name}` : 'Chat photos'}
      overlay={payload ? <SenderBadge sender={payload.sender} sentAt={payload.sentAt} /> : null}
    />
  );
}

/** Top-left of the viewer: whose photos these are. Fades and hides with the toolbar. */
function SenderBadge({ sender, sentAt }: { sender: ChatParticipant; sentAt: string }) {
  return (
    <div className="lightbox-demo-chrome-top lightbox-demo-chrome-hide absolute start-3 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-30 flex items-center gap-2.5">
      <ParticipantAvatar person={sender} size="default" />
      <div className="leading-tight">
        <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">{sender.name}</div>
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{sentAt}</div>
      </div>
    </div>
  );
}

function ChatHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <AvatarGroup aria-hidden>
        {participants.map((person) => (
          <ParticipantAvatar key={person.id} person={person} />
        ))}
      </AvatarGroup>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">Lisbon trip</div>
        <div className="text-[11px] text-neutral-500">
          {participants.length + 1} people · {conversation.length.toLocaleString('en-US')} messages ·{' '}
          {conversationPhotoCount.toLocaleString('en-US')} photos
        </div>
      </div>
    </div>
  );
}

function ParticipantAvatar({ person, size = 'sm' }: { person: ChatParticipant; size?: 'sm' | 'default' }) {
  return (
    <Avatar size={size} aria-hidden>
      <AvatarFallback className={`font-semibold ${size === 'sm' ? 'text-[10px]' : 'text-xs'} ${person.colorClass}`}>
        {person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function estimateRowSize(message: ChatMessage): number {
  const name = message.author !== 'me' && message.startsRun ? 18 : 0;
  const text = message.text ? 44 : 0;
  const photos = message.images.length === 0 ? 0 : message.images.length === 1 ? 300 : 248;
  return 8 + name + text + photos;
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
  const sender = participantById.get(message.author);
  const body = <MessageBody message={message} mine={!sender} />;
  if (!sender) return <div className="py-1">{body}</div>;
  return (
    <div className="flex items-end gap-2 py-1">
      <ParticipantAvatar person={sender} />
      <div className="min-w-0 flex-1">
        <div className={message.startsRun ? 'px-3 pb-1 text-[11px] text-neutral-500' : 'sr-only'}>{sender.name}</div>
        {body}
      </div>
    </div>
  );
});

function MessageBody({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}>
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
}

/**
 * Outer corners of a grid tile; inner edges stay square. The radius must live
 * on the Trigger, not just the grid's clip: the morph reads it from there.
 */
function tileCornerClass(index: number, count: number): string {
  if (count === 2) return index === 0 ? 'rounded-l-2xl' : 'rounded-r-2xl';
  if (count === 3) return ['rounded-l-2xl', 'rounded-tr-2xl', 'rounded-br-2xl'][index]!;
  return ['rounded-tl-2xl', 'rounded-tr-2xl', 'rounded-bl-2xl', 'rounded-br-2xl'][index]!;
}

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
            // Crossfade so the "+N" overlay dissolves into the photo instead
            // of popping.
            crossfade={overflow ? 'both' : undefined}
            label={overflow ? `Open ${image.alt}, ${hidden.length} more` : `Open ${image.alt}`}
            // Half-width tiles; the tall one is cropped from a full-height image.
            sizes={tall ? '260px' : '130px'}
            className={`relative block size-full overflow-hidden ${tileCornerClass(i, count)} ${tall ? 'row-span-2' : ''}`}
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
  crossfade,
  label,
  sizes,
  className,
  imageClassName,
  children,
}: {
  image: ChatImage;
  payload: ViewerPayload;
  crossfade?: 'both';
  label: string;
  sizes: string;
  className: string;
  imageClassName: string;
  children?: React.ReactNode;
}) {
  return (
    <Lightbox.Trigger
      itemId={image.id}
      payload={payload}
      crossfade={crossfade}
      aria-label={label}
      // Room when Ramka scrolls the trigger into view: clear of the list's
      // edge on top, and of the sticky "rows mounted" pill at the bottom.
      className={`scroll-mt-4 scroll-mb-12 cursor-pointer border-none bg-neutral-200 p-0 dark:bg-neutral-800 ${triggerFocusClass} ${className}`}
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
```

```ts examples/lightbox/shared-lightbox/chat-data.ts
import type { StaticImageData } from 'next/image';

import { photoImages } from '../photos-app/images.generated';

/**
 * A synthetic, deterministic conversation: a thousand messages, about a fifth
 * carrying photos (1–9 per message). Stands in for the messages a chat client
 * would page in from its API — every photo has a stable id, its own message,
 * and a place in the conversation's media timeline.
 */

export interface ChatImage {
  /** Stable, conversation-unique id — the key Triggers and Items share. */
  id: string;
  src: StaticImageData;
  alt: string;
  /** Position inside its message (tiles 0–3 are visible, the rest sit behind "+N"). */
  indexInMessage: number;
}

export interface ChatParticipant {
  id: string;
  name: string;
  initials: string;
  /** Avatar background and text classes. */
  colorClass: string;
}

/** Everyone in the group besides "me". */
export const participants: readonly ChatParticipant[] = [
  { id: 'ola', name: 'Ola Nowak', initials: 'ON', colorClass: 'bg-rose-500 text-white' },
  { id: 'sam', name: 'Sam Carter', initials: 'SC', colorClass: 'bg-amber-500 text-white' },
  { id: 'priya', name: 'Priya Shah', initials: 'PS', colorClass: 'bg-emerald-600 text-white' },
  { id: 'jules', name: 'Jules Martin', initials: 'JM', colorClass: 'bg-violet-500 text-white' },
];

export const participantById = new Map(participants.map((p) => [p.id, p]));

/** The local user, for places that name every sender (the viewer's header). */
export const me: ChatParticipant = { id: 'me', name: 'You', initials: 'AK', colorClass: 'bg-blue-500 text-white' };

export interface ChatMessage {
  id: string;
  /** `'me'`, or a participant id. */
  author: string;
  /** First message of a run by the same author (shows their name). */
  startsRun: boolean;
  time: string;
  text?: string;
  images: ChatImage[];
}

const MESSAGE_COUNT = 1000;

const photos: readonly StaticImageData[] = photoImages;

const lines = [
  'did you see the light this morning',
  'ok sending the rest',
  'haha',
  'these came out way better than I expected',
  'which one is your favourite?',
  'the second one for sure',
  'on my way',
  'look at this',
  'can you send the originals',
  'sure, give me a sec',
  'we should go back there in spring',
  'lol',
  'that last one is going on the wall',
  'dinner at 8?',
  'yes!!',
  'the film ones are still at the lab',
  'wait how did you get that angle',
  'stood on a bench, don’t tell anyone',
  'brb',
  'ok these are unreal',
];

// mulberry32 — small, fast, and stable across runs, so the server and client
// render the same conversation.
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function photoCount(roll: number): number {
  if (roll < 0.4) return 1;
  if (roll < 0.6) return 2;
  if (roll < 0.72) return 3;
  if (roll < 0.82) return 4;
  return 5 + Math.floor(((roll - 0.82) / 0.18) * 5);
}

/**
 * Deals photos like a shuffled deck: every photo is used once before any
 * repeats, and a message never repeats a photo — its own or the previous
 * photo message's.
 */
function createPhotoDeck(random: () => number) {
  let deck: StaticImageData[] = [];
  let previous: StaticImageData[] = [];
  const shuffle = () => {
    deck = [...photos];
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j]!, deck[i]!];
    }
  };
  return (count: number): StaticImageData[] => {
    const hand: StaticImageData[] = [];
    while (hand.length < count) {
      if (deck.length === 0) shuffle();
      // Across a reshuffle, skip photos that were just shown.
      const index = deck.findIndex((photo) => !hand.includes(photo) && !previous.includes(photo));
      if (index < 0) {
        shuffle();
        continue;
      }
      hand.push(deck.splice(index, 1)[0]!);
    }
    if (count > 0) previous = hand;
    return hand;
  };
}

function buildConversation(): ChatMessage[] {
  const random = createRandom(7);
  const deal = createPhotoDeck(random);
  const start = Date.UTC(2026, 7, 1, 8, 0);
  let minutes = 0;
  let photoSeq = 0;
  let previousAuthor = '';
  return Array.from({ length: MESSAGE_COUNT }, (_, m): ChatMessage => {
    minutes += 1 + Math.floor(random() * 40);
    // People send a few messages in a row before someone else replies.
    const author =
      previousAuthor && random() < 0.55
        ? previousAuthor
        : random() < 0.4
          ? 'me'
          : participants[Math.floor(random() * participants.length)]!.id;
    const startsRun = author !== previousAuthor;
    previousAuthor = author;
    const withPhotos = random() < 0.22;
    const count = withPhotos ? photoCount(random()) : 0;
    const id = `m${m}`;
    const images = deal(count).map((src, i): ChatImage => {
      photoSeq += 1;
      return {
        id: `${id}-p${i}`,
        src,
        alt: `Photo ${photoSeq}`,
        indexInMessage: i,
      };
    });
    const hasText = !withPhotos || random() < 0.35;
    const time = new Date(start + minutes * 60_000).toISOString().slice(0, 16).replace('T', ' ');
    return {
      id,
      author,
      startsRun,
      time,
      text: hasText ? lines[Math.floor(random() * lines.length)] : undefined,
      images,
    };
  });
}

export const conversation = buildConversation();

export const conversationPhotoCount = conversation.reduce((sum, message) => sum + message.images.length, 0);

/** Feed row (message index) of each photo, for scrolling an unmounted one back into view. */
export const rowOfImage = new Map<string, number>(
  conversation.flatMap((message, row) => message.images.map((image) => [image.id, row] as const)),
);
```
