import { createContext, flushSync, getContext, setContext, type Snippet } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { resolveIndex, type TextDirection } from './gestures.js';
import { canMorph, decoded, morph, morphSource, snapshotRootMoves, stableViewport, type MorphPreset } from './morph.js';
import { paintPlaceholder } from './placeholder.js';

export type { TextDirection };
export type MorphTo = 'active' | 'origin' | 'closest';
export type Crossfade = 'open' | 'close' | 'both';
export type NavigationSource = 'trigger' | 'keyboard' | 'thumbnail' | 'button' | 'scroll' | 'imperative';
export type Caption = string | Snippet;

export interface ScrollTriggerOption {
  type: 'onChange' | 'onOpenComplete' | 'onClose';
  behavior?: 'smooth' | 'instant';
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}
export type ScrollTriggerIntoView = null | ScrollTriggerOption | ScrollTriggerOption[];

export interface BeforeOpenContext {
  destination: Element | null;
  signal: AbortSignal;
}

export interface BeforeCloseContext {
  destination: Element | null;
}

export interface ZoomApi {
  readonly zoom: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly panDistance: number;
  readonly gesturing: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  zoomIn(): void;
  zoomOut(): void;
  reset(): void;
  pan(dx: number, dy: number): void;
}

interface RootProps {
  loop?: boolean;
  count?: number;
  dir?: TextDirection;
  viewTransition?: boolean | MorphPreset;
  morphTo?: MorphTo;
  scrollTriggerIntoView?: ScrollTriggerIntoView;
  awaitImageDecode?: boolean | number;
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  onValueChange?: (value: number, meta: { source: NavigationSource }) => void;
  onBeforeOpen?: (ctx: BeforeOpenContext) => void | Promise<void>;
  onBeforeClose?: (ctx: BeforeCloseContext) => void;
}

interface Binding {
  open: boolean;
  index: number;
}

/** Read-only view of the enclosing Root for custom parts, returned by `getLightbox()`. */
export interface LightboxState {
  readonly open: boolean;
  readonly index: number;
  readonly count: number;
  readonly loop: boolean;
  readonly dir: TextDirection;
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly caption: Caption | undefined;
  readonly zoomed: boolean;
  readonly pulling: boolean;
  readonly pullDismissing: boolean;
  go(index: number, source?: NavigationSource): void;
  show(index?: number): Promise<void>;
  close(): Promise<void>;
}

export interface TriggerEntry {
  el: HTMLElement;
  readonly index: number;
  readonly id?: string;
  readonly crossfade?: Crossfade;
  morph?: HTMLElement;
  image?: HTMLImageElement;
}

export interface ItemEntry {
  el: HTMLElement;
  caption?: Caption;
  media?: HTMLElement;
  morph?: HTMLElement;
  image?: HTMLImageElement;
}

/** `scrollIntoView` options for one moment of `scrollTriggerIntoView`, or undefined when it is off. */
export function scrollOption(config: ScrollTriggerIntoView | undefined, type: ScrollTriggerOption['type']) {
  const match = [config ?? []].flat().find((o) => o.type === type);
  return (
    match && {
      behavior: match.behavior ?? 'smooth',
      block: match.block ?? 'nearest',
      inline: match.inline ?? 'nearest',
    }
  );
}

/** The element whose pixels bridge the morph for a trigger. */
export const triggerMorph = (t: TriggerEntry) => t.morph ?? t.image ?? morphSource(t.el);

const DECODE_CAP = 200;

/** Shared state of one lightbox: open/index, registries, gesture flags and the morph flows. */
export class LightboxModel implements LightboxState {
  #readProps: () => RootProps;
  #binding: Binding;
  readonly id: string;
  present = $state(false);
  preparing = $state(false);
  scrolling = $state(false);
  pulling = $state(false);
  pullSnapping = $state(false);
  pullDismissing = $state(false);
  closing = $state(false);
  direction = $state<'forward' | 'backward'>('forward');
  tablists = $state(0);
  opener = $state.raw<TriggerEntry>();
  contentEl = $state<HTMLElement>();
  stageEl = $state<HTMLElement>();
  slidesEl = $state<HTMLElement>();
  items = new SvelteMap<number, ItemEntry>();
  triggers = new SvelteSet<TriggerEntry>();
  count = $derived(this.items.size || this.#props.count || 0);
  zoomed = $derived(!!this.activeZoom?.canZoomOut);
  zooming = $derived(!!this.activeZoom?.gesturing);
  zooms = new SvelteMap<number, ZoomApi>();
  portal: HTMLElement | null = null;
  stageMorph: HTMLElement | undefined;
  strip: { scrub(index: number): void } | undefined;
  instant = false;
  origin = -1;
  transition: Promise<unknown> = Promise.resolve();
  #busy = false;
  #settled: boolean;
  #abort = new AbortController();

  constructor(binding: Binding, props: () => RootProps, id: string) {
    this.#binding = binding;
    this.#readProps = props;
    this.id = id;
    this.present = binding.open;
    this.#settled = binding.open;
  }

  get #props() {
    return this.#readProps();
  }

  get open() {
    return this.#binding.open;
  }

  get index() {
    return this.#binding.index;
  }

  get loop() {
    return this.#props.loop ?? false;
  }

  get dir(): TextDirection {
    return this.#props.dir ?? 'ltr';
  }

  /** The `dir` passed to Root, written to the Portal host only when set. */
  get dirAttribute() {
    return this.#props.dir;
  }

  get contentId() {
    return this.contentEl?.id || `${this.id}-content`;
  }

  get caption() {
    return this.items.get(this.index)?.caption;
  }

  get preset(): MorphPreset {
    const vt = this.#props.viewTransition;
    return typeof vt === 'string' ? vt : 'default';
  }

  /** True while a close morph runs on mobile Blink, which aborts when the overlay unmounts mid-transition. */
  get held() {
    return this.closing && snapshotRootMoves();
  }

  get canPrev() {
    return this.loop || this.index > 0;
  }

  get canNext() {
    return this.loop || this.index < this.count - 1;
  }

  get activeZoom() {
    return this.zooms.get(this.index);
  }

  /** Commits a new active index and reports it with its source. */
  setIndex(i: number, source: NavigationSource) {
    if (i === this.index) return;
    this.direction = i > this.index ? 'forward' : 'backward';
    this.#binding.index = i;
    this.#props.onValueChange?.(i, { source });
  }

  /** Moves to slide `i`; `instant` skips the smooth scroll (used inside a crossfade). */
  go(i: number, source: NavigationSource = 'imperative', instant = false) {
    if (!this.count || this.scrolling) return;
    const next = resolveIndex(i, this.count, this.loop);
    if (next === this.index) return;
    this.instant = instant;
    if (source !== 'thumbnail') this.strip?.scrub(next);
    this.setIndex(next, source);
  }

  /** Last registered trigger for an index. */
  triggerAt(i: number) {
    let found: TriggerEntry | undefined;
    for (const t of this.triggers) if (t.index === i) found = t;
    return found;
  }

  /** Trigger that receives the close morph, picked by `morphTo`. */
  closeTarget(): TriggerEntry | undefined {
    const morphTo = this.#props.morphTo ?? 'active';
    if (morphTo === 'origin') return this.triggerAt(this.origin);
    const active = this.triggerAt(this.index);
    if (active || morphTo === 'active') return active;
    let best: TriggerEntry | undefined;
    for (const t of this.triggers) {
      if (!best || Math.abs(t.index - this.index) < Math.abs(best.index - this.index)) best = t;
    }
    return best;
  }

  /** The element the morph lands on for item `i`: Stage morphRef, item morphRef, Media, image, then the item. */
  destination(i: number) {
    const item = this.items.get(i);
    return this.stageMorph ?? item?.morph ?? item?.media ?? item?.image ?? item?.el;
  }

  /** Backdrop and content, which fade as their own groups when the page stays live during a morph. */
  layers() {
    const backdrop = this.portal?.querySelector<HTMLElement>('[data-ramka-backdrop]');
    return [backdrop, this.contentEl].filter((el): el is HTMLElement => !!el);
  }

  /** Scrolls the close target into view for one `scrollTriggerIntoView` moment. */
  scrollTrigger(type: ScrollTriggerOption['type']) {
    const options = scrollOption(this.#props.scrollTriggerIntoView, type);
    const target = options && this.closeTarget();
    target?.el.scrollIntoView(options);
  }

  /** Fires `onOpenChangeComplete` once per settled open or close. */
  settle(open: boolean) {
    if (this.#settled === open || this.open !== open) return;
    this.#settled = open;
    this.#props.onOpenChangeComplete?.(open);
    if (open) this.scrollTrigger('onOpenComplete');
  }

  destroy() {
    this.#abort.abort();
  }

  #morphs(trigger?: TriggerEntry): trigger is TriggerEntry {
    return !!trigger && this.#props.viewTransition !== false && canMorph();
  }

  #crossfades(trigger: TriggerEntry, phase: 'open' | 'close') {
    return trigger.crossfade === 'both' || trigger.crossfade === phase;
  }

  #cancelPrepare() {
    this.#abort.abort();
    flushSync(() => (this.preparing = false));
  }

  async show(index = this.index, via?: TriggerEntry | string, source: NavigationSource = 'imperative') {
    if (this.open || this.preparing || this.#busy) return;
    const trigger =
      (typeof via === 'string' ? [...this.triggers].find((t) => t.id === via) : via) || this.triggerAt(index);
    const morphs = this.#morphs(trigger);
    this.#abort.abort();
    const { signal } = (this.#abort = new AbortController());
    flushSync(() => {
      this.origin = index;
      this.opener = trigger;
      this.setIndex(index, source);
      this.preparing = morphs;
    });
    const reveal = () => {
      flushSync(() => {
        this.preparing = false;
        this.#binding.open = true;
        this.present = true;
      });
      this.#props.onOpenChange?.(true);
    };
    if (!morphs) return reveal();
    const entry = this.items.get(index);
    const to = this.destination(index);
    const host = entry?.media;
    const image = entry?.image ?? host?.querySelector('img');
    const removePlaceholder =
      image && host && !image.complete
        ? paintPlaceholder(image, trigger.image ?? trigger.el.querySelector('img'), host)
        : null;
    try {
      const wait = this.#props.awaitImageDecode ?? true;
      if (to && !removePlaceholder) await decoded(to, wait === true ? DECODE_CAP : wait || 0);
      if (!signal.aborted) await this.#props.onBeforeOpen?.({ destination: to ?? null, signal });
    } catch {
      if (!signal.aborted) this.#cancelPrepare();
    }
    if (!signal.aborted && snapshotRootMoves()) await stableViewport();
    if (signal.aborted) return removePlaceholder?.();
    this.#busy = true;
    entry?.el.setAttribute('data-skip-fade', '');
    this.transition = morph({
      phase: 'opening',
      preset: this.preset,
      crossfade: this.#crossfades(trigger, 'open'),
      layers: this.layers(),
      from: triggerMorph(trigger),
      update: () => {
        reveal();
        return to;
      },
    }).catch(() => {});
    await this.transition;
    this.#busy = false;
    entry?.el.removeAttribute('data-skip-fade');
    if (removePlaceholder && image && !image.complete) {
      image.addEventListener('load', removePlaceholder, { once: true });
      image.addEventListener('error', removePlaceholder, { once: true });
    } else removePlaceholder?.();
  }

  async close() {
    if (this.preparing) return this.#cancelPrepare();
    if (!this.open || this.#busy) return;
    this.#abort.abort();
    const trigger = this.closeTarget();
    const from = this.destination(this.index);
    this.#props.onBeforeClose?.({ destination: from ?? null });
    this.scrollTrigger('onClose');
    this.#props.onOpenChange?.(false);
    if (!from || !this.#morphs(trigger)) {
      this.#binding.open = false;
      this.pullDismissing = false;
      return;
    }
    const to = triggerMorph(trigger);
    this.#busy = true;
    this.closing = true;
    this.transition = morph({
      phase: 'closing',
      preset: this.preset,
      crossfade: this.#crossfades(trigger, 'close'),
      layers: this.layers(),
      from,
      update: () => {
        flushSync(() => {
          this.#binding.open = false;
          this.present = false;
        });
        return to;
      },
    }).catch(() => {});
    await this.transition;
    this.#busy = false;
    this.closing = false;
    this.pullDismissing = false;
    this.settle(false);
  }
}

export const [getModel, setModel] = createContext<LightboxModel>();

/** State of the enclosing Root for custom parts; throws outside a Root. */
export const getLightbox: () => LightboxState = getModel;

/** Imperative handle from `createHandle()`; pass it to Root and to detached Triggers. */
export class LightboxHandle {
  state = $state<LightboxModel>();

  /** Opens at `index`; `triggerId` picks the registered Trigger the morph starts from. */
  open(index?: number, options?: { triggerId?: string }) {
    this.state?.show(index, options?.triggerId, 'imperative');
  }

  close() {
    this.state?.close();
  }

  /** Navigates without opening. */
  goTo(index: number) {
    this.state?.go(index, 'imperative');
  }

  get isOpen() {
    return this.state?.open ?? false;
  }
}

/** Creates a handle for imperative control and Triggers outside the Root. */
export const createHandle = () => new LightboxHandle();

/** Attachment that designates the node the open/close morph captures. */
export type MorphRef = (node: HTMLElement) => () => void;
/** Attachment that designates the image used for decode waits and the placeholder. */
export type ImageRef = (node: HTMLImageElement) => () => void;

export interface ItemContext {
  readonly index: number;
  readonly active: boolean;
  morphRef: MorphRef;
  imageRef: ImageRef;
}

const ITEM = Symbol('ramka-item');
export const setItem = (item: ItemContext) => setContext(ITEM, item);
/** Context of the enclosing `Item`, or null outside one. */
export const getItem = () => getContext<ItemContext | undefined>(ITEM) ?? null;

const ENTRY = Symbol('ramka-item-entry');
export const setEntry = (entry: ItemEntry) => setContext(ENTRY, entry);
export const getEntry = () => getContext<ItemEntry | undefined>(ENTRY);

export interface TriggerContext {
  readonly open: boolean;
  readonly active: boolean;
  morphRef: MorphRef;
  imageRef: ImageRef;
}

const TRIGGER = Symbol('ramka-trigger');
export const setTrigger = (trigger: TriggerContext) => setContext(TRIGGER, trigger);
/** Context of the enclosing `Trigger`, or null outside one. */
export const getTrigger = () => getContext<TriggerContext | undefined>(TRIGGER) ?? null;

export interface StageContext {
  morphRef: MorphRef;
}

const STAGE = Symbol('ramka-stage');
export const setStage = (stage: StageContext) => setContext(STAGE, stage);
/** Context of the enclosing `Stage`, or null outside one. */
export const getStage = () => getContext<StageContext | undefined>(STAGE) ?? null;

export interface MediaContext {
  /** The Media host element, the morph and placeholder target. */
  readonly element: HTMLElement | null;
}

const MEDIA = Symbol('ramka-media');
export const setMedia = (media: MediaContext) => setContext(MEDIA, media);
/** Context of the enclosing `Media`, or null outside one. */
export const getMedia = () => getContext<MediaContext | undefined>(MEDIA) ?? null;

interface StripContext {
  select(index: number, viewTransition: boolean): void;
  setTrack(el: HTMLElement | undefined): void;
}

const STRIP = Symbol('ramka-strip');
export const setStrip = (strip: StripContext) => setContext(STRIP, strip);
export const getStrip = () => getContext<StripContext | undefined>(STRIP);

interface GroupContext {
  thumbs: Map<number, HTMLElement>;
}

const GROUP = Symbol('ramka-group');
export const setGroup = (group: GroupContext) => setContext(GROUP, group);
export const getGroup = () => getContext<GroupContext | undefined>(GROUP);

const SLIDES = Symbol('ramka-slides');
export const setSlides = (slides: { readonly preload: number }) => setContext(SLIDES, slides);
export const getSlides = () => getContext<{ readonly preload: number } | undefined>(SLIDES);

const ZOOM = Symbol('ramka-zoom');
export const setZoom = (zoom: ZoomApi) => setContext(ZOOM, zoom);
export const getZoom = () => getContext<ZoomApi | undefined>(ZOOM);

const NONCE = Symbol('ramka-nonce');
export const setNonce = (nonce: () => string | undefined) => setContext(NONCE, nonce);
export const getNonce = () => getContext<(() => string | undefined) | undefined>(NONCE)?.();

/** `morphRef` / `imageRef` attachments that record their node on a registry entry. */
export function refs(target: { morph?: HTMLElement; image?: HTMLImageElement }) {
  return {
    morphRef: (node: HTMLElement) => {
      target.morph = node;
      return () => {
        if (target.morph === node) target.morph = undefined;
      };
    },
    imageRef: (node: HTMLImageElement) => {
      target.image = node;
      return () => {
        if (target.image === node) target.image = undefined;
      };
    },
  };
}
