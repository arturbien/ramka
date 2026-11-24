import type { StaticImageData } from 'next/image';

import {
  ramkaA,
  ramkaB,
  ramkaC,
  ramkaD,
  ramkaE,
  ramkaF,
  ramkaG,
  ramkaH,
  ramkaI,
  ramkaJ,
  ramkaK,
  ramkaL,
  ramkaM,
  ramkaN,
} from '../../../../_components/images.generated';
import { lightboxImageFiles } from '../../../../_data/images.generated';

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

export interface ChatMessage {
  id: string;
  author: 'me' | 'them';
  time: string;
  text?: string;
  images: ChatImage[];
}

const MESSAGE_COUNT = 1000;

const photos: StaticImageData[] = [
  ramkaA,
  ramkaB,
  ramkaC,
  ramkaD,
  ramkaE,
  ramkaF,
  ramkaG,
  ramkaH,
  ramkaI,
  ramkaJ,
  ramkaK,
  ramkaL,
  ramkaM,
  ramkaN,
  ...lightboxImageFiles,
];

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

function buildConversation(): ChatMessage[] {
  const random = createRandom(7);
  const start = Date.UTC(2026, 7, 1, 8, 0);
  let minutes = 0;
  let photoSeq = 0;
  return Array.from({ length: MESSAGE_COUNT }, (_, m) => {
    minutes += 1 + Math.floor(random() * 40);
    const author = random() < 0.5 ? 'me' : 'them';
    const withPhotos = random() < 0.22;
    const count = withPhotos ? photoCount(random()) : 0;
    const id = `m${m}`;
    const images = Array.from({ length: count }, (_, i): ChatImage => {
      photoSeq += 1;
      return {
        id: `${id}-p${i}`,
        src: photos[Math.floor(random() * photos.length)]!,
        alt: `Photo ${photoSeq}`,
        indexInMessage: i,
      };
    });
    const hasText = !withPhotos || random() < 0.35;
    const time = new Date(start + minutes * 60_000).toISOString().slice(0, 16).replace('T', ' ');
    return {
      id,
      author,
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
