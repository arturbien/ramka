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
